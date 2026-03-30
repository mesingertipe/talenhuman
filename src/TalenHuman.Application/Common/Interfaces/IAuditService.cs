using TalenHuman.Domain.Entities;

namespace TalenHuman.Application.Common.Interfaces;

public interface IAuditService
{
    Task LogAsync(string action, string entityType, string? entityId, string? details, bool isSuccess = true, Guid? overrideUserId = null, Guid? overrideCompanyId = null, string? overrideUserName = null);
    Task CleanupOldLogsAsync(Guid companyId, int daysToKeep);
}
