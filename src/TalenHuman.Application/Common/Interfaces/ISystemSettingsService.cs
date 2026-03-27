namespace TalenHuman.Application.Common.Interfaces;

public interface ISystemSettingsService
{
    Task<string?> GetSettingAsync(string key);
    Task<T?> GetSettingAsync<T>(string key);
    Task SetSettingAsync(string key, string value, string group = "General", string? description = null);
    Task<IDictionary<string, string>> GetGroupSettingsAsync(string group);
}
