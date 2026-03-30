using Microsoft.AspNetCore.Http;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace TalenHuman.Infrastructure.Services;

public class AuditService : IAuditService
{
    private readonly IApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ITenantProvider _tenantProvider;

    public AuditService(IApplicationDbContext context, IHttpContextAccessor httpContextAccessor, ITenantProvider tenantProvider)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _tenantProvider = tenantProvider;
    }

    public async Task LogAsync(string action, string entityType, string? entityId, string? details, bool isSuccess = true, Guid? overrideUserId = null, Guid? overrideCompanyId = null, string? overrideUserName = null)
    {
        try
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var ip = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString();

            Guid? userId = overrideUserId;
            if (userId == null && Guid.TryParse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var parsedUserId))
            {
                userId = parsedUserId;
            }

            Guid companyId = overrideCompanyId ?? Guid.Empty;
            if (companyId == Guid.Empty)
            {
                companyId = _tenantProvider.GetTenantId();
            }

            var auditLog = new AuditLog
            {
                CompanyId = companyId,
                UserId = userId,
                UserName = overrideUserName ?? user?.FindFirst(ClaimTypes.Email)?.Value ?? user?.FindFirst(ClaimTypes.Name)?.Value ?? "System",
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                Details = details,
                IpAddress = ip,
                IsSuccess = isSuccess,
                CreatedAt = DateTime.UtcNow // Force UTC for standard audit logs
            };

            // Cannot use _context.AuditLogs.Add directly if it interferes with current transaction.
            // But since this is scoped, it will be saved with the next SaveChangesAsync... 
            // Wait, we want to ensure it saves even if the parent fails, OR we want it coupled. 
            // Often we want it coupled, so if the user creation fails, the log doesn't assert success.
            // Actually, we'll force a save here if we are logging independent actions (like Login).
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync(CancellationToken.None);
        }
        catch (Exception ex)
        {
            // Do not break the main workflow if auditing fails, just log to console
            Console.WriteLine($"Audit Logging failed: {ex.Message}");
        }
    }

    public async Task CleanupOldLogsAsync(Guid companyId, int daysToKeep)
    {
        try
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-daysToKeep);
            var logsToDelete = await _context.AuditLogs
                .Where(l => l.CompanyId == companyId && l.CreatedAt < cutoffDate)
                .ToListAsync();

            if (logsToDelete.Any())
            {
                _context.AuditLogs.RemoveRange(logsToDelete);
                await _context.SaveChangesAsync(CancellationToken.None);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error cleaning up audit logs: {ex.Message}");
        }
    }
}
