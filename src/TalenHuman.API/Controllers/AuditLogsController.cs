using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Domain.Entities;
using TalenHuman.Infrastructure.Persistence;
using System.Security.Claims;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class AuditLogsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AuditLogsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AuditLogDto>>> GetLogs(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? actionType,
        [FromQuery] string? entityType,
        [FromQuery] Guid? userId,
        [FromQuery] int limit = 100)
    {
        try
        {
            var query = _context.AuditLogs.AsQueryable();

            if (startDate.HasValue)
            {
                var startUtc = startDate.Value.ToUniversalTime().Date;
                query = query.Where(l => l.CreatedAt >= startUtc);
            }

            if (endDate.HasValue)
            {
                var endUtc = endDate.Value.ToUniversalTime().Date.AddDays(1).AddTicks(-1);
                query = query.Where(l => l.CreatedAt <= endUtc);
            }

            if (!string.IsNullOrEmpty(actionType))
            {
                query = query.Where(l => l.Action == actionType);
            }

            if (!string.IsNullOrEmpty(entityType))
            {
                query = query.Where(l => l.EntityType == entityType);
            }

            if (userId.HasValue)
            {
                query = query.Where(l => l.UserId == userId.Value);
            }

            var logs = await query
                .OrderByDescending(l => l.CreatedAt)
                .Take(limit) // Hard limit to avoid huge payloads. UI should probably rely on this or pagination.
                .Select(l => new AuditLogDto
                {
                    Id = l.Id,
                    Timestamp = l.CreatedAt,
                    UserName = l.UserName,
                    Action = l.Action,
                    EntityType = l.EntityType,
                    EntityId = l.EntityId,
                    Details = l.Details,
                    IpAddress = l.IpAddress,
                    IsSuccess = l.IsSuccess
                })
                .ToListAsync();

            return Ok(logs);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error al consultar logs: {ex.Message}" });
        }
    }

    [HttpDelete("clear")]
    public async Task<IActionResult> ClearLogs([FromQuery] int olderThanDays = 60)
    {
        try
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-olderThanDays);
            var logsToDelete = await _context.AuditLogs
                .Where(l => l.CreatedAt < cutoffDate)
                .ToListAsync();

            if (logsToDelete.Any())
            {
                _context.AuditLogs.RemoveRange(logsToDelete);
                
                // Add an audit log FOR the audit log deletion (meta-auditing)
                var currentUserIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                Guid? currentUserId = null;
                if (Guid.TryParse(currentUserIdString, out var parsedId)) currentUserId = parsedId;
                
                var metaLog = new AuditLog
                {
                    CompanyId = _context.TenantId,
                    UserId = currentUserId,
                    UserName = User.FindFirst(ClaimTypes.Email)?.Value ?? "System",
                    Action = "DELETE",
                    EntityType = "AuditLogs",
                    Details = $"Se eliminaron {logsToDelete.Count} registros de auditoría anteriores a {cutoffDate:yyyy-MM-dd}",
                    CreatedAt = DateTime.UtcNow,
                    IsSuccess = true
                };
                
                _context.AuditLogs.Add(metaLog);
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = $"Limpieza completada. Registros eliminados: {logsToDelete.Count}" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error al depurar logs: {ex.Message}" });
        }
    }
}

public class AuditLogDto
{
    public Guid Id { get; set; }
    public DateTime Timestamp { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
    public bool IsSuccess { get; set; }
}
