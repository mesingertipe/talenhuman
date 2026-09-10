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

    private bool IsTenantKey(string key, out string cleanKey)
    {
        cleanKey = key;
        var firstUnderscore = key.IndexOf('_');
        if (firstUnderscore > 0)
        {
            var prefix = key.Substring(0, firstUnderscore);
            if (Guid.TryParse(prefix, out _))
            {
                cleanKey = key.Substring(firstUnderscore + 1);
                return true;
            }
        }
        return false;
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

    public async Task SetSettingAsync(string key, string value, string group = "General", string? description = null, bool isGlobal = false)
    {
        var targetKey = isGlobal ? key : GetPrefixedKey(key);
        var setting = await _context.SystemSettings
            .FirstOrDefaultAsync(s => s.Key == targetKey);

        if (setting == null)
        {
            setting = new SystemSetting
            {
                Key = targetKey,
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

        if (isGlobal)
        {
            // Borrar cualquier override específico por tenant para garantizar consistencia global
            var overrides = await _context.SystemSettings
                .Where(s => s.Key.EndsWith($"_{key}"))
                .ToListAsync();
            if (overrides.Any())
            {
                _context.SystemSettings.RemoveRange(overrides);
            }
        }

        await _context.SaveChangesAsync(default);
    }

    public async Task<IDictionary<string, string>> GetGroupSettingsAsync(string group)
    {
        var tenantId = _tenantProvider.GetTenantId();
        var allGroupSettings = await _context.SystemSettings
            .Where(s => s.Group == group)
            .AsNoTracking()
            .ToListAsync();

        // Follow the same priority logic as GetMergedSettingsAsync
        var result = allGroupSettings
            .Where(s => {
                var isTenant = IsTenantKey(s.Key, out _);
                return !isTenant || (tenantId != Guid.Empty && s.Key.StartsWith($"{tenantId}_"));
            })
            .Select(s => {
                var isTenant = IsTenantKey(s.Key, out string cleanKey);
                return new {
                    CleanKey = cleanKey,
                    IsTenantSpecific = isTenant,
                    Value = s.Value
                };
            })
            .GroupBy(x => x.CleanKey)
            .Select(g => g.OrderByDescending(x => x.IsTenantSpecific).First())
            .ToDictionary(x => x.CleanKey, x => x.Value);

        return result;
    }

    public async Task<IEnumerable<SystemSetting>> GetMergedSettingsAsync()
    {
        var tenantId = _tenantProvider.GetTenantId();
        var allSettings = await _context.SystemSettings.AsNoTracking().ToListAsync();
        
        // 1. Identify relevant settings (global or current tenant)
        var filteredSettings = allSettings.Where(s => {
            var isTenant = IsTenantKey(s.Key, out _);
            return !isTenant || (tenantId != Guid.Empty && s.Key.StartsWith($"{tenantId}_"));
        }).ToList();

        // 2. Group by "Clean Key" to resolve priority
        var mergedResult = filteredSettings
            .Select(s => {
                var isTenant = IsTenantKey(s.Key, out string cleanKey);
                return new { 
                    CleanKey = cleanKey,
                    IsTenantSpecific = isTenant,
                    Original = s
                };
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

