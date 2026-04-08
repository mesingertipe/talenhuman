using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Application.Services;
using TalenHuman.Domain.Entities;
using System.Linq;
using System.Security.Claims;

namespace TalenHuman.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ShiftApprovalController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly NotificationService _notificationService;
    private readonly ITenantProvider _tenantProvider;
    private readonly IAuditService _auditService;

    public ShiftApprovalController(
        IApplicationDbContext context, 
        NotificationService notificationService,
        ITenantProvider tenantProvider,
        IAuditService auditService)
    {
        _context = context;
        _notificationService = notificationService;
        _tenantProvider = tenantProvider;
        _auditService = auditService;
    }

    [HttpGet("pending-stores")]
    [HttpGet("stores")]
    [Authorize(Roles = "Admin,SuperAdmin,RH,Supervisor")]
    public async Task<IActionResult> GetPendingStores([FromQuery] ShiftStatus status = ShiftStatus.PendingApproval)
    {
        var companyId = _tenantProvider.GetTenantId();
        var userClaimIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userClaimIdString)) return Unauthorized();
        
        var userClaimId = Guid.Parse(userClaimIdString);
        bool isTopAdmin = User.IsInRole("Admin") || User.IsInRole("SuperAdmin");
        
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userClaimId);
        if (user == null && !isTopAdmin) return Unauthorized();

        var settings = await _context.OperationalSettings
            .FirstOrDefaultAsync(o => o.CompanyId == companyId);
        
        var approvalMode = settings?.ShiftApprovalMode ?? ShiftApprovalMode.HR;

        var query = _context.Shifts
            .Include(s => s.Store)
                .ThenInclude(st => st.District)
            .Where(s => s.CompanyId == companyId && s.Status == status);

        if (approvalMode == ShiftApprovalMode.District && !isTopAdmin) {
            if (user != null && user.DistrictId.HasValue) {
                query = query.Where(s => s.Store.DistrictId == user.DistrictId);
            } else {
                return Ok(new List<object>()); 
            }
        }

        var storeGroups = await query
            .GroupBy(s => new { 
                s.StoreId, 
                s.Store.Name, 
                s.Store.ExternalId, 
                DistrictName = s.Store.District != null ? s.Store.District.Name : "SIN DISTRITO" 
            })
            .Select(g => new {
                StoreId = g.Key.StoreId,
                Name = g.Key.Name,
                ExternalId = g.Key.ExternalId,
                DistrictName = g.Key.DistrictName,
                PendingCount = g.Count(),
                MinDate = g.Min(s => s.StartTime),
                MaxDate = g.Max(s => s.StartTime),
                LastUploadAt = g.Max(s => s.CreatedAt)
            })
            .ToListAsync();

        // V18.8: Enriquecer con información de auditoría (Usuario que Registra)
        var result = new List<object>();
        foreach (var group in storeGroups)
        {
            // Intentar encontrar el último log de auditoría de creación/edición de turnos para esta tienda
            var lastLog = await _context.AuditLogs
                .Where(al => al.CompanyId == companyId && 
                            al.EntityType == "Shifts" && 
                            al.EntityId == group.StoreId.ToString())
                .OrderByDescending(al => al.CreatedAt)
                .Select(al => new { al.UserName, al.UserId })
                .FirstOrDefaultAsync();

            string authorName = "SISTEMA";
            string authorProfile = "PROCESO AUTOMÁTICO";

            if (lastLog != null && lastLog.UserId.HasValue)
            {
                var authorUser = await _context.Users
                    .Include(u => u.Employee)
                        .ThenInclude(e => e.Profile)
                    .FirstOrDefaultAsync(u => u.Id == lastLog.UserId);
                
                if (authorUser != null)
                {
                    authorName = authorUser.FullName;
                    authorProfile = authorUser.Employee?.Profile?.Name ?? "USUARIO";
                }
            }
            else
            {
                // Fallback: Gerente de la Sede
                var manager = await _context.SupervisorStores
                    .Include(ss => ss.User)
                        .ThenInclude(u => u.Employee)
                            .ThenInclude(e => e.Profile)
                    .Where(ss => ss.StoreId == group.StoreId)
                    .Select(ss => ss.User)
                    .FirstOrDefaultAsync();

                if (manager != null)
                {
                    authorName = manager.FullName;
                    authorProfile = manager.Employee?.Profile?.Name ?? "GERENTE";
                }
            }

            result.Add(new {
                group.StoreId,
                group.Name,
                group.ExternalId,
                group.DistrictName,
                group.PendingCount,
                group.MinDate,
                group.MaxDate,
                group.LastUploadAt,
                AuthorName = authorName,
                AuthorProfile = authorProfile
            });
        }

        return Ok(result);
    }

    [HttpPost("approve")]
    [Authorize(Roles = "Admin,SuperAdmin,RH,Supervisor")]
    public async Task<IActionResult> ApproveShifts([FromBody] ApprovalRequest request)
    {
        var companyId = _tenantProvider.GetTenantId();
        var approverIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(approverIdString)) return Unauthorized();
        var approverId = Guid.Parse(approverIdString);

        var shifts = await _context.Shifts
            .Where(s => s.CompanyId == companyId && 
                        s.StoreId == request.StoreId && 
                        s.StartTime.Date >= request.StartDate.Date && 
                        s.StartTime.Date <= request.EndDate.Date &&
                        s.Status == ShiftStatus.PendingApproval)
            .ToListAsync();

        if (!shifts.Any()) return NotFound("No hay turnos pendientes para este rango.");

        foreach (var shift in shifts)
        {
            shift.Status = ShiftStatus.Approved;
            shift.ApprovedByUserId = approverId;
            shift.ApprovedAt = DateTime.UtcNow;
            shift.ApprovalComment = request.Comment;
        }

        await _context.SaveChangesAsync(CancellationToken.None);
        
        // ⚙️ V18.8.3: Obtener Configuración Corporativa Global
        var settings = await _context.OperationalSettings
            .FirstOrDefaultAsync(o => o.CompanyId == companyId);

        // 🕵️ Identificar al Autor (Audit Log)
        var lastLog = await _context.AuditLogs
            .Where(al => al.CompanyId == companyId && 
                        al.EntityType == "Shifts" && 
                        al.EntityId == request.StoreId.ToString())
            .OrderByDescending(al => al.CreatedAt)
            .FirstOrDefaultAsync();

        string? authorEmail = null;
        if (lastLog != null && lastLog.UserId.HasValue) 
        {
            var authorUser = await _context.Users.FindAsync(lastLog.UserId.Value);
            authorEmail = authorUser?.Email;
        }

        // 📧 Notificaciones Email
        if (settings?.EnableEmailNotifications ?? true)
        {
            var managers = await _context.SupervisorStores
                .Include(ss => ss.User)
                .Where(ss => ss.StoreId == request.StoreId)
                .Select(ss => ss.User)
                .ToListAsync();

            var emails = managers.Where(m => !string.IsNullOrEmpty(m.Email)).Select(m => m.Email).ToList();
            if (!string.IsNullOrEmpty(authorEmail) && !emails.Contains(authorEmail)) emails.Add(authorEmail);

            foreach (var email in emails)
            {
                await _notificationService.SendNotificationAsync(new NotificationRequest {
                    To = email,
                    Subject = "✅ Programación APROBADA",
                    Message = $"La programación del {request.StartDate:dd/MM} al {request.EndDate:dd/MM} ha sido validada oficialmente.\n\nComentario: {request.Comment}",
                    Type = NotificationType.Email
                });
            }
        }

        // 📱 PUSH Masivo a Empleados ACTIVOS
        if (settings?.EnablePushNotifications ?? true)
        {
            var employees = await _context.Employees
                .Include(e => e.User)
                .Where(e => e.CompanyId == companyId && e.StoreId == request.StoreId && e.IsActive && e.User != null && !string.IsNullOrEmpty(e.User.FirebaseToken))
                .Select(e => new { e.User!.Id, e.User.FirebaseToken })
                .ToListAsync();

            if (employees.Any())
            {
                await _notificationService.SendBroadcastAsync(
                    employees.Select(e => e.Id),
                    employees.Select(e => e.FirebaseToken!),
                    new NotificationRequest {
                        Subject = "¡Horario Publicado! ✅",
                        Message = $"Tu programación para {request.StartDate:dd/MM} — {request.EndDate:dd/MM} ya está disponible. ¡Consúltala!",
                        Type = NotificationType.Push,
                        Category = "shift_reminder"
                    }
                );
            }
        }

        await _auditService.LogAsync("APPROVAL_FLOW", "Shifts", request.StoreId.ToString(), $"Programación aprobada para el periodo {request.StartDate:dd/MM} - {request.EndDate:dd/MM}.");

        return Ok(new { Message = "Turnos aprobados y notificaciones enviadas según configuración." });
    }

    [HttpGet("status")]
    [Authorize]
    public async Task<IActionResult> GetStatus([FromQuery] Guid storeId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        var companyId = _tenantProvider.GetTenantId();
        
        var shifts = await _context.Shifts
            .Where(s => s.CompanyId == companyId && 
                        s.StoreId == storeId && 
                        s.StartTime.Date >= startDate.Date && 
                        s.StartTime.Date <= endDate.Date)
            .ToListAsync();

        if (!shifts.Any()) 
            return Ok(new { Status = "Empty", Message = "No hay turnos cargados" });

        if (shifts.Any(s => s.Status == ShiftStatus.Rejected))
        {
            var firstRejection = shifts.FirstOrDefault(s => s.Status == ShiftStatus.Rejected);
            return Ok(new { 
                Status = "Rejected", 
                Comment = firstRejection?.ApprovalComment, 
                Date = firstRejection?.ApprovedAt 
            });
        }

        if (shifts.All(s => s.Status == ShiftStatus.Approved))
            return Ok(new { Status = "Approved", Date = shifts.First().ApprovedAt });

        return Ok(new { Status = "Pending", Message = "Pendiente de validación por RH/Distrital" });
    }

    [HttpPost("reject")]
    [Authorize(Roles = "Admin,SuperAdmin,RH,Supervisor")]
    public async Task<IActionResult> RejectShifts([FromBody] ApprovalRequest request)
    {
        if (string.IsNullOrEmpty(request.Comment)) 
            return BadRequest("El comentario de rechazo es obligatorio.");

        var companyId = _tenantProvider.GetTenantId();
        var approverIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(approverIdString)) return Unauthorized();
        var approverId = Guid.Parse(approverIdString);

        var shifts = await _context.Shifts
            .Where(s => s.CompanyId == companyId && 
                        s.StoreId == request.StoreId && 
                        s.StartTime.Date >= request.StartDate.Date && 
                        s.StartTime.Date <= request.EndDate.Date &&
                        s.Status == ShiftStatus.PendingApproval)
            .ToListAsync();

        if (!shifts.Any()) return NotFound("No hay turnos pendientes para este rango.");

        foreach (var shift in shifts)
        {
            shift.Status = ShiftStatus.Rejected;
            shift.ApprovedByUserId = approverId;
            shift.ApprovedAt = DateTime.UtcNow;
            shift.ApprovalComment = request.Comment;
        }

        await _context.SaveChangesAsync(CancellationToken.None);

        // ⚙️ V18.8.3: Configuración Corporativa
        var settings = await _context.OperationalSettings
            .FirstOrDefaultAsync(o => o.CompanyId == companyId);

        // 🕵️ Identificar Autor mediante log de auditoría
        var lastLog = await _context.AuditLogs
            .Where(al => al.CompanyId == companyId && 
                        al.EntityType == "Shifts" && 
                        al.EntityId == request.StoreId.ToString())
            .OrderByDescending(al => al.CreatedAt)
            .FirstOrDefaultAsync();

        string? authorEmail = null;
        if (lastLog != null && lastLog.UserId.HasValue) 
        {
            var authorUser = await _context.Users.FindAsync(lastLog.UserId.Value);
            authorEmail = authorUser?.Email;
        }

        // 📧 Notificaciones Email de Rechazo (Si aplica)
        if (settings?.EnableEmailNotifications ?? true)
        {
            var managers = await _context.SupervisorStores
                .Include(ss => ss.User)
                .Where(ss => ss.StoreId == request.StoreId)
                .Select(ss => ss.User)
                .ToListAsync();

            var emails = managers.Where(m => !string.IsNullOrEmpty(m.Email)).Select(m => m.Email).ToList();
            if (!string.IsNullOrEmpty(authorEmail) && !emails.Contains(authorEmail)) emails.Add(authorEmail);

            foreach (var email in emails)
            {
                await _notificationService.SendNotificationAsync(new NotificationRequest {
                    To = email,
                    Subject = "🚨 Programación RECHAZADA - Ajustes Requeridos",
                    Message = $"La programación del {request.StartDate:dd/MM} al {request.EndDate:dd/MM} NO ha sido aprobada.\n\nMOTIVO DEL RECHAZO: {request.Comment}\n\nPor favor, realice los ajustes y vuelva a publicar.",
                    Type = NotificationType.Email
                });
            }
        }

        await _auditService.LogAsync("REJECTION_FLOW", "Shifts", request.StoreId.ToString(), $"Programación RECHAZADA para el periodo {request.StartDate:dd/MM} - {request.EndDate:dd/MM}. Motivo: {request.Comment}");

        return Ok(new { Message = "Turnos rechazados y notificaciones enviadas correctamente al autor y supervisores." });
    }

    public class ApprovalRequest
    {
        public Guid StoreId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? Comment { get; set; }
    }
}
