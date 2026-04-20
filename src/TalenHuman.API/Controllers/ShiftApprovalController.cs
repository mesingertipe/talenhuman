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
        bool isTopAdmin = User.IsInRole("Admin") || User.IsInRole("SuperAdmin") || User.IsInRole("RH");
        
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userClaimId);
        if (user == null && !isTopAdmin) return Unauthorized();

        var settings = await _context.OperationalSettings
            .FirstOrDefaultAsync(o => o.CompanyId == companyId);
        
        var approvalMode = settings?.ShiftApprovalMode ?? ShiftApprovalMode.HR;
        
        // V19.5: Dynamic status filtering based on request
        WeeklyApprovalStatus targetStatus = WeeklyApprovalStatus.Published; 
        if (status == ShiftStatus.Approved) targetStatus = WeeklyApprovalStatus.Approved;
        if (status == ShiftStatus.Rejected) targetStatus = WeeklyApprovalStatus.Rejected;

        var query = _context.WeeklyApprovals
            .Include(a => a.Store)
                .ThenInclude(s => s.District)
            .Where(a => a.CompanyId == companyId && a.Status == targetStatus);

        if (approvalMode == ShiftApprovalMode.District && !isTopAdmin) {
            if (user != null && user.DistrictId.HasValue) {
                query = query.Where(a => a.Store.DistrictId == user.DistrictId);
            } else {
                return Ok(new List<object>()); 
            }
        }

        var masterRecords = await query
            .Select(a => new {
                id = a.Id,
                storeId = a.StoreId,
                name = a.Store.Name,
                externalId = a.Store.ExternalId,
                districtName = a.Store.District != null ? a.Store.District.Name : "SIN DISTRITO",
                weekStartDate = a.WeekStartDate,
                minDate = a.WeekStartDate,
                maxDate = a.WeekStartDate.AddDays(6),
                latestComment = a.LatestComment,
                latestActionAt = a.LatestActionAt
            })
            .ToListAsync();

        var result = new List<object>();
        foreach (var item in masterRecords)
        {
            // V19.0: Trace the specific author of the 'Published' action
            var lastPublishedLog = await _context.WeeklyApprovalLogs
                .Include(logEntry => logEntry.User)
                    .ThenInclude(u => u.Employee)
                        .ThenInclude(e => e.Profile)
                .Where(logEntry => logEntry.WeeklyApproval.StoreId == item.storeId && 
                            logEntry.WeeklyApproval.WeekStartDate == item.weekStartDate &&
                            logEntry.Action == "Published")
                .OrderByDescending(logEntry => logEntry.ActionAt)
                .FirstOrDefaultAsync();

            string authorName = lastPublishedLog?.User?.FullName ?? "GERENTE";
            string authorProfile = lastPublishedLog?.User?.Employee?.Profile?.Name ?? "USUARIO";

            result.Add(new {
                id = item.id,
                storeId = item.storeId,
                name = item.name,
                externalId = item.externalId,
                districtName = item.districtName,
                pendingCount = 1, 
                weekStartDate = item.weekStartDate,
                minDate = item.minDate,
                maxDate = item.maxDate,
                lastUploadAt = item.latestActionAt,
                authorName = authorName,
                authorProfile = authorProfile,
                comment = item.latestComment
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

        var normalizedStart = GetMondayOfDate(request.StartDate);

        // V19.0: Master Update
        var approval = await _context.WeeklyApprovals
            .FirstOrDefaultAsync(a => a.StoreId == request.StoreId && a.WeekStartDate == normalizedStart);
            
        if (approval != null)
        {
            approval.Status = WeeklyApprovalStatus.Approved;
            approval.LatestComment = request.Comment;
            approval.LatestActionAt = DateTime.UtcNow;
            
            var log = new WeeklyApprovalLog
            {
                WeeklyApproval = approval,
                UserId = approverId,
                Action = "Approved",
                Comment = request.Comment,
                ActionAt = DateTime.UtcNow,
                CompanyId = companyId
            };
            _context.WeeklyApprovalLogs.Add(log);
        }

        // V13.0 Bridge: Update individual shifts for mobile app consistency
        var allStoreShifts = await _context.Shifts
            .Where(s => s.CompanyId == companyId && 
                        s.StoreId == request.StoreId &&
                        s.Status != ShiftStatus.Approved) 
            .ToListAsync();
            
        var shifts = allStoreShifts.Where(s => GetMondayOfDate(s.StartTime) == normalizedStart).ToList();

        foreach (var shift in shifts)
        {
            shift.Status = ShiftStatus.Approved;
            shift.ApprovedByUserId = approverId;
            shift.ApprovedAt = DateTime.UtcNow;
            shift.ApprovalComment = request.Comment;
        }

        await _context.SaveChangesAsync(CancellationToken.None);
        
        // Notifications Logic
        var settings = await _context.OperationalSettings.FirstOrDefaultAsync(o => o.CompanyId == companyId);
        var displayEnd = request.EndDate.AddDays(-1);

        if (settings?.EnableEmailNotifications ?? true)
        {
            var store = await _context.Stores.Include(s => s.Brand).FirstOrDefaultAsync(s => s.Id == request.StoreId);
            var managers = await _context.SupervisorStores.Include(ss => ss.User)
                .Where(ss => ss.StoreId == request.StoreId).Select(ss => ss.User).ToListAsync();
            var emails = managers.Where(m => !string.IsNullOrEmpty(m.Email)).Select(m => m.Email).ToList();

            string storeInfo = store != null ? $"{store.Brand?.Name} - Sede: {store.Name} ({store.ExternalId})" : request.StoreId.ToString();
            await _notificationService.SendBatchEmailNotificationAsync(emails, new NotificationRequest {
                Subject = $"✅ Programación APROBADA - {store?.Name}",
                Message = $"La programación de la sede <b>{storeInfo}</b> para el periodo <b>{request.StartDate:dd/MM}</b> al <b>{displayEnd:dd/MM}</b> ha sido validada oficialmente.\n\nComentario: {request.Comment}",
                Type = NotificationType.Email
            });
        }

        await _auditService.LogAsync("APPROVAL_FLOW", "Shifts", request.StoreId.ToString(), $"Programación aprobada para el periodo {request.StartDate:dd/MM} - {displayEnd:dd/MM}.");

        return Ok(new { Message = "Turnos aprobados satisfactoriamente." });
    }

    [HttpGet("status")]
    [Authorize]
    public async Task<IActionResult> GetStatus([FromQuery] Guid? id, [FromQuery] Guid? storeId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        WeeklyApproval? approval = null;
        if (id.HasValue) 
        {
            approval = await _context.WeeklyApprovals
                .Include(a => a.Logs)
                    .ThenInclude(l => l.User)
                .FirstOrDefaultAsync(a => a.Id == id.Value);
        }
        else if (storeId.HasValue && startDate.HasValue)
        {
            var normalizedStart = GetMondayOfDate(startDate.Value);
            approval = await _context.WeeklyApprovals
                .Include(a => a.Logs)
                    .ThenInclude(l => l.User)
                .FirstOrDefaultAsync(a => a.StoreId == storeId.Value && a.WeekStartDate == normalizedStart);
        }

        if (approval == null) 
            return Ok(new { status = "Empty", message = "Sin registro de aprobación maestro." });

        var history = approval.Logs.OrderByDescending(logEntry => logEntry.ActionAt).Select(logEntry => new {
            action = logEntry.Action,
            comment = logEntry.Comment,
            date = logEntry.ActionAt,
            user = logEntry.User.FullName
        }).ToList();

        return Ok(new { 
            status = approval.Status.ToString(), 
            date = approval.LatestActionAt,
            comment = approval.LatestComment,
            history = history,
            storeId = approval.StoreId,
            weekStartDate = approval.WeekStartDate
        });
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

        var normalizedStart = GetMondayOfDate(request.StartDate);

        // V19.0: Master Reject
        var approval = await _context.WeeklyApprovals
            .FirstOrDefaultAsync(a => a.StoreId == request.StoreId && a.WeekStartDate == normalizedStart);
            
        if (approval != null)
        {
            approval.Status = WeeklyApprovalStatus.Rejected;
            approval.LatestComment = request.Comment;
            approval.LatestActionAt = DateTime.UtcNow;
            
            var log = new WeeklyApprovalLog
            {
                WeeklyApproval = approval,
                UserId = approverId,
                Action = "Rejected",
                Comment = request.Comment,
                ActionAt = DateTime.UtcNow,
                CompanyId = companyId
            };
            _context.WeeklyApprovalLogs.Add(log);
        }

        // Bridge: Update individual shifts
        var allStoreShifts = await _context.Shifts
            .Where(s => s.CompanyId == companyId && 
                        s.StoreId == request.StoreId &&
                        s.Status != ShiftStatus.Approved) 
            .ToListAsync();
            
        var shifts = allStoreShifts.Where(s => GetMondayOfDate(s.StartTime) == normalizedStart).ToList();

        foreach (var shift in shifts)
        {
            shift.Status = ShiftStatus.Rejected;
            shift.ApprovedByUserId = approverId;
            shift.ApprovedAt = DateTime.UtcNow;
            shift.ApprovalComment = request.Comment;
        }

        await _context.SaveChangesAsync(CancellationToken.None);

        // Notifications
        var store = await _context.Stores.Include(s => s.Brand).FirstOrDefaultAsync(s => s.Id == request.StoreId);
        var managers = await _context.SupervisorStores.Include(ss => ss.User)
            .Where(ss => ss.StoreId == request.StoreId).Select(ss => ss.User).ToListAsync();
        var emails = managers.Where(m => !string.IsNullOrEmpty(m.Email)).Select(m => m.Email).ToList();

        var displayEnd = request.EndDate.AddDays(-1);

        string storeInfo = store != null ? $"{store.Brand?.Name} - Sede: {store.Name} ({store.ExternalId})" : request.StoreId.ToString();
        await _notificationService.SendBatchEmailNotificationAsync(emails, new NotificationRequest {
            Subject = $"🚨 Programación RECHAZADA - {store?.Name}",
            Message = $"La programación de la sede <b>{storeInfo}</b> para el periodo <b>{request.StartDate:dd/MM}</b> al <b>{displayEnd:dd/MM}</b> ha sido RECHAZADA.\n\nMotivo: {request.Comment}",
            Type = NotificationType.Email
        });

        await _auditService.LogAsync("REJECTION_FLOW", "Shifts", request.StoreId.ToString(), $"Programación rechazada para el periodo {request.StartDate:dd/MM} - {displayEnd:dd/MM}.");

        return Ok(new { Message = "Turnos rechazados correctamente." });
    }

    public class ApprovalRequest
    {
        public Guid StoreId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? Comment { get; set; }
    }

    private DateTime GetMondayOfDate(DateTime date)
    {
        var day = (int)date.DayOfWeek;
        var diff = (day == 0 ? 6 : day - 1);
        return date.Date.AddDays(-diff);
    }
}
