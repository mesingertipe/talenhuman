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
    [Authorize(Roles = "Admin,SuperAdmin,RH,Supervisor")] // Added Supervisor role
    public async Task<IActionResult> GetPendingStores()
    {
        var companyId = _tenantProvider.GetTenantId();
        var userClaimId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
        
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userClaimId);
        if (user == null) return Unauthorized();

        // 1. Get operational settings
        var settings = await _context.OperationalSettings
            .FirstOrDefaultAsync(o => o.CompanyId == companyId);
        
        var approvalMode = settings?.ShiftApprovalMode ?? ShiftApprovalMode.HR;

        // 2. Fetch pending stores with hierarchy logic
        var query = _context.Shifts
            .Include(s => s.Store)
            .Include(s => s.Employee)
            .Where(s => s.CompanyId == companyId && s.Status == ShiftStatus.PendingApproval);

        // Security logic: If District mode is active, filter by user's assigned district
        // unless the user is a top-level Admin/SuperAdmin
        bool isTopAdmin = User.IsInRole("Admin") || User.IsInRole("SuperAdmin");
        
        if (approvalMode == ShiftApprovalMode.District && !isTopAdmin) {
            if (user.DistrictId.HasValue) {
                query = query.Where(s => s.Store.DistrictId == user.DistrictId);
            } else {
                // If it's district mode but supervisor has no district, they see nothing pending
                return Ok(new List<object>()); 
            }
        }

        var pendingStores = await query
            .GroupBy(s => new { s.StoreId, s.Store.Name })
            .Select(g => new {
                StoreId = g.Key.StoreId,
                StoreName = g.Key.Name,
                PendingCount = g.Count(),
                MinDate = g.Min(s => s.StartTime),
                MaxDate = g.Max(s => s.StartTime)
            })
            .ToListAsync();

        return Ok(pendingStores);
    }

    [HttpPost("approve")]
    [Authorize(Roles = "Admin,SuperAdmin,RH")]
    public async Task<IActionResult> ApproveShifts([FromBody] ApprovalRequest request)
    {
        var companyId = _tenantProvider.GetTenantId();
        var approverId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());

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

        // 📧 1. Notificar al Gerente de la Tienda (Email)
        var managers = await _context.SupervisorStores
            .Include(ss => ss.User)
            .Where(ss => ss.StoreId == request.StoreId)
            .Select(ss => ss.User)
            .ToListAsync();

        foreach (var manager in managers.Where(m => !string.IsNullOrEmpty(m.Email)))
        {
            await _notificationService.SendNotificationAsync(new NotificationRequest {
                To = manager.Email,
                Subject = "✅ Malla de Turnos APROBADA",
                Message = $"La programación del {request.StartDate:dd/MM} al {request.EndDate:dd/MM} ha sido aprobada por RH.\n\nComentario: {request.Comment}",
                Type = NotificationType.Email
            });
        }

        // 📱 V13.0: Employee PUSH notification removed to avoid noise as requested.
        await _auditService.LogAsync("APPROVAL_FLOW", "Shifts", request.StoreId.ToString(), $"Malla aprobada para el periodo {request.StartDate:dd/MM} - {request.EndDate:dd/MM}.");

        return Ok(new { Message = "Turnos aprobados y notificaciones enviadas." });
    }

    [HttpPost("reject")]
    [Authorize(Roles = "Admin,SuperAdmin,RH")]
    public async Task<IActionResult> RejectShifts([FromBody] ApprovalRequest request)
    {
        if (string.IsNullOrEmpty(request.Comment)) 
            return BadRequest("El comentario de rechazo es obligatorio.");

        var companyId = _tenantProvider.GetTenantId();
        var approverId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());

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

        // 📧 Notificar al Gerente de la Tienda de que debe CORREGIR (Email)
        var managers = await _context.SupervisorStores
            .Include(ss => ss.User)
            .Where(ss => ss.StoreId == request.StoreId)
            .Select(ss => ss.User)
            .ToListAsync();

        foreach (var manager in managers.Where(m => !string.IsNullOrEmpty(m.Email)))
        {
            await _notificationService.SendNotificationAsync(new NotificationRequest {
                To = manager.Email,
                Subject = "❌ Malla de Turnos RECHAZADA",
                Message = $"La programación del {request.StartDate:dd/MM} al {request.EndDate:dd/MM} ha sido rechazada por RH y requiere ajustes.\n\nMotivo del rechazo: {request.Comment}",
                Type = NotificationType.Email
            });
        }

        return Ok(new { Message = "Turnos rechazados y gerente notificado." });
    }

    public class ApprovalRequest
    {
        public Guid StoreId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? Comment { get; set; }
    }
}
