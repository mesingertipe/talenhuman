using System;

namespace TalenHuman.Application.Common.Interfaces;

public interface ITenantTimeProvider
{
    DateTime Now { get; }
    DateTime UtcNow { get; }
    DateTime ConvertToTenantTime(DateTime utcDateTime);
}
