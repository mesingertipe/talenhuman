using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;

namespace TalenHuman.Infrastructure.Services;

public class SystemSettingsService : ISystemSettingsService
{
    private readonly IApplicationDbContext _context;

    public SystemSettingsService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<string?> GetSettingAsync(string key)
    {
        var setting = await _context.SystemSettings
            .FirstOrDefaultAsync(s => s.Key == key);
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
        var setting = await _context.SystemSettings
            .FirstOrDefaultAsync(s => s.Key == key);

        if (setting == null)
        {
            setting = new SystemSetting
            {
                Key = key,
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
}
