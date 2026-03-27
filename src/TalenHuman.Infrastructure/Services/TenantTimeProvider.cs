using System;
using Microsoft.Extensions.Configuration;
using Npgsql;
using TalenHuman.Application.Common.Interfaces;

namespace TalenHuman.Infrastructure.Services;

public class TenantTimeProvider : ITenantTimeProvider
{
    private readonly ITenantProvider _tenantProvider;
    private readonly string _connectionString;
    private string? _cachedTimeZoneId;
    private Guid _cachedTenantId = Guid.Empty;

    public TenantTimeProvider(ITenantProvider tenantProvider, IConfiguration configuration)
    {
        _tenantProvider = tenantProvider;
        _connectionString = configuration.GetConnectionString("DefaultConnection") ?? "";
    }

    public DateTime Now 
    {
        get 
        {
            var zoneId = GetTimeZoneId();
            try 
            {
                var zone = TimeZoneInfo.FindSystemTimeZoneById(zoneId);
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, zone);
            }
            catch 
            {
                // Fallback to SA Pacific if zone not found
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("SA Pacific Standard Time"));
            }
        }
    }

    public DateTime UtcNow => DateTime.UtcNow;

    public DateTime ConvertToTenantTime(DateTime utcDateTime)
    {
        var zoneId = GetTimeZoneId();
        try 
        {
            var zone = TimeZoneInfo.FindSystemTimeZoneById(zoneId);
            return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, zone);
        }
        catch 
        {
            return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, TimeZoneInfo.FindSystemTimeZoneById("SA Pacific Standard Time"));
        }
    }

    private string GetTimeZoneId()
    {
        var tenantId = _tenantProvider.GetTenantId();
        
        if (tenantId == Guid.Empty) return "SA Pacific Standard Time";
        if (tenantId == _cachedTenantId && _cachedTimeZoneId != null) return _cachedTimeZoneId;

        try 
        {
            using var connection = new NpgsqlConnection(_connectionString);
            connection.Open();
            using var command = new NpgsqlCommand("SELECT \"TimeZoneId\" FROM \"Companies\" WHERE \"Id\" = @id", connection);
            command.Parameters.AddWithValue("id", tenantId);
            
            var result = command.ExecuteScalar()?.ToString();
            if (!string.IsNullOrEmpty(result))
            {
                _cachedTenantId = tenantId;
                _cachedTimeZoneId = result;
                return result;
            }
        }
        catch 
        {
            // Silently fail and use default
        }

        return "SA Pacific Standard Time";
    }
}
