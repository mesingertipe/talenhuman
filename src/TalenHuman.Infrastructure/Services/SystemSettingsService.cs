using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;

namespace TalenHuman.Infrastructure.Services;

public class SystemSettingsService : ISystemSettingsService
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public SystemSettingsService(IApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    private string GetPrefixedKey(string key)
    {
        var tenantId = _tenantProvider.GetTenantId();
        if (tenantId == Guid.Empty) return key; // Global fallback
        if (key.StartsWith($"{tenantId}_")) return key; // Already prefixed
        return $"{tenantId}_{key}";
    }

    public async Task<string?> GetSettingAsync(string key)
    {
        var prefixedKey = GetPrefixedKey(key);
        var setting = await _context.SystemSettings
            .FirstOrDefaultAsync(s => s.Key == prefixedKey);
        
        // Fallback to global if tenant-specific not found
        if (setting == null && prefixedKey != key)
        {
            setting = await _context.SystemSettings
                .FirstOrDefaultAsync(s => s.Key == key);
        }

        
        return setting?.Value;
    }

    public async Task<T?> GetSettingAsync<T>(string key)
    {
        var value = await GetSettingAsync(key);
        if (string.IsNullOrEmpty(value)) return default;

        try
        {
            return (T)Convert.ChangeType(value, typeof(T));
        }
        catch
        {
            return default;
        }
    }

    public async Task SetSettingAsync(string key, string value, string group = "General", string? description = null)
    {
        var prefixedKey = GetPrefixedKey(key);
        var setting = await _context.SystemSettings
            .FirstOrDefaultAsync(s => s.Key == prefixedKey);

        if (setting == null)
        {
            setting = new SystemSetting
            {
                Key = prefixedKey,
                Value = value,
                Group = group,
                Description = description
            };
            _context.SystemSettings.Add(setting);
        }
        else
        {
            setting.Value = value;
            if (!string.IsNullOrEmpty(description)) setting.Description = description;
            setting.Group = group;
        }

        await _context.SaveChangesAsync(default);
    }

    public async Task<IDictionary<string, string>> GetGroupSettingsAsync(string group)
    {
        return await _context.SystemSettings
            .Where(s => s.Group == group)
            .ToDictionaryAsync(s => s.Key, s => s.Value);
    }

    public async Task<IEnumerable<SystemSetting>> GetMergedSettingsAsync()
    {
        var tenantId = _tenantProvider.GetTenantId();
        var allSettings = await _context.SystemSettings.AsNoTracking().ToListAsync();
        
        // 1. Identify relevant settings (global or current tenant)
        var filteredSettings = allSettings.Where(s => 
            !s.Key.Contains('_') || 
            (tenantId != Guid.Empty && s.Key.StartsWith($"{tenantId}_"))
        ).ToList();

        // 2. Group by "Clean Key" to resolve priority
        var mergedResult = filteredSettings
            .Select(s => new { 
                CleanKey = s.Key.Contains('_') ? s.Key.Split('_', 2)[1] : s.Key,
                IsTenantSpecific = s.Key.Contains('_'),
                Original = s
            })
            .GroupBy(x => x.CleanKey)
            .Select(g => {
                // Prioritize Tenant if exists, otherwise Global
                var best = g.OrderByDescending(x => x.IsTenantSpecific).First();
                
                // Return a copy with the clean key for UI matching
                return new SystemSetting {
                    Key = best.CleanKey,
                    Value = best.Original.Value,
                    Group = best.Original.Group,
                    Description = best.Original.Description
                };
            })
            .ToList();

        return mergedResult;
    }
}

