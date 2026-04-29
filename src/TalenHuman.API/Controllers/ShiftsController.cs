using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;
using TalenHuman.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FirebaseAdmin.Messaging;
using System.Security.Claims;

namespace TalenHuman.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ShiftsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly Application.Services.NotificationService _notificationService;

    public ShiftsController(
        IApplicationDbContext context, 
        IAuditService auditService,
        Application.Services.NotificationService notificationService)
    {
        _context = context;
        _auditService = auditService;
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ShiftDto>>> GetShifts(
        [FromQuery] Guid storeId, 
        [FromQuery] DateTime startDate, 
        [FromQuery] DateTime endDate)
    {
        // Normalize UTC dates from frontend for PostgreSQL 'timestamp without time zone'
        var start = DateTime.SpecifyKind(startDate, DateTimeKind.Unspecified);
        var end = DateTime.SpecifyKind(endDate, DateTimeKind.Unspecified);

        // Ensure dates are compared correctly in Colombia Time
        var shifts = await _context.Shifts
            .Where(s => s.StoreId == storeId && s.StartTime >= start && s.StartTime <= end)
            .Select(s => new ShiftDto
            {
                Id = s.Id,
                EmployeeId = s.EmployeeId,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                Status = s.Status,
                IsDescanso = s.IsDescanso,
                IsFuera = s.IsFuera,
                Observation = s.Observation
            })
            .ToListAsync();

        return Ok(shifts);
    }

    [HttpPost("bulk")]
    public async Task<IActionResult> BulkUpdate([FromBody] BulkShiftUpdateDto dto)
    {
        var userClaimIdString = User.FindFirst(ClaimTypes.NameIdentifier).Value;
        var userClaimId = Guid.Parse(userClaimIdString);
 
        // Normalize UTC dates from frontend for PostgreSQL 'timestamp without time zone'
        var start = DateTime.SpecifyKind(dto.StartDate, DateTimeKind.Unspecified);
        var end = DateTime.SpecifyKind(dto.EndDate, DateTimeKind.Unspecified);

        // 1. Get approved Novedades (Absences) for this store and range to validate
        var approvedNews = await _context.Novedades
            .Where(n => (n.Empleado != null && n.Empleado.StoreId == dto.StoreId) || (n.StoreId == dto.StoreId))
            .Where(n => n.Status == NovedadStatus.Aprobado)
            .Where(n => n.FechaInicio <= end && n.FechaFin >= start)
            .Include(n => n.Empleado)
            .Include(n => n.NovedadTipo)
            .ToListAsync();

        // 2. Validate conflicts
        foreach (var sDto in dto.Shifts)
        {
            var conflict = approvedNews.FirstOrDefault(n => 
                n.EmpleadoId == sDto.EmployeeId && 
                n.FechaInicio.Date <= sDto.StartTime.Date && 
                n.FechaFin.Date >= sDto.StartTime.Date);

            if (conflict != null)
            {
                var empName = conflict.Empleado != null ? $"{conflict.Empleado.FirstName} {conflict.Empleado.LastName}" : "Empleado";
                return BadRequest(new { 
                    message = $"Conflicto: {empName} tiene una novedad de '{conflict.NovedadTipo.Nombre}' aprobada para el día {sDto.StartTime:dd/MM/yyyy}." 
                });
            }
        }

        // 3. Get existing shifts in the range
        var existingShifts = await _context.Shifts
            .Where(s => s.StoreId == dto.StoreId && s.StartTime >= start && s.StartTime <= end)
            .ToListAsync();

        // 3.1 Identify shifts that have associated Attendances to avoid FK violations (Error 23503)
        var shiftIds = existingShifts.Select(s => s.Id).ToList();
        var shiftsWithAttendance = await _context.Attendances
            .Where(a => a.ShiftId.HasValue && shiftIds.Contains(a.ShiftId.Value))
            .Select(a => a.ShiftId.Value)
            .Distinct()
            .ToListAsync();

        // 3.2 Only remove shifts that DON'T have attendances
        var shiftsToDelete = existingShifts.Where(s => !shiftsWithAttendance.Contains(s.Id)).ToList();
        _context.Shifts.RemoveRange(shiftsToDelete);

        // 4. Add new ones
        foreach (var sDto in dto.Shifts)
        {
            _context.Shifts.Add(new Shift
            {
                EmployeeId = sDto.EmployeeId,
                StoreId = dto.StoreId,
                StartTime = DateTime.SpecifyKind(sDto.StartTime, DateTimeKind.Unspecified),
                EndTime = DateTime.SpecifyKind(sDto.EndTime, DateTimeKind.Unspecified),
                Status = ShiftStatus.PendingApproval, // V13.0 Requirement: All new shifts start as pending
                IsDescanso = sDto.IsDescanso,
                IsFuera = sDto.IsFuera,
                Observation = dto.Comment, // Use the bulk comment
                CompanyId = Guid.Empty // Set by interceptor usually
            });
        }

        await _context.SaveChangesAsync(default);
 
        // V19.0: MASTER APPROVAL SYSTEM - Registry and Trace
        var normalizedStart = GetMondayOfDate(dto.StartDate);
        var approval = await _context.WeeklyApprovals
            .FirstOrDefaultAsync(a => a.StoreId == dto.StoreId && a.WeekStartDate == normalizedStart);
            
        if (approval == null)
        {
            approval = new WeeklyApproval
            {
                StoreId = dto.StoreId,
                WeekStartDate = normalizedStart,
                CompanyId = Guid.Empty // Set by interceptor
            };
            _context.WeeklyApprovals.Add(approval);
        }
 
        approval.Status = WeeklyApprovalStatus.Published;
        approval.LatestComment = dto.Comment;
        approval.LatestActionAt = DateTime.UtcNow;
 
        var log = new WeeklyApprovalLog
        {
            WeeklyApproval = approval,
            UserId = userClaimId,
            Action = "Published",
            Comment = dto.Comment,
            ActionAt = DateTime.UtcNow,
            CompanyId = Guid.Empty // Set by interceptor
        };
        _context.WeeklyApprovalLogs.Add(log);
 
        await _context.SaveChangesAsync(default);

        // 5. Audit Trace (Replacing previous PUSH logic)
        var displayEnd = end.AddDays(-1);
        await _auditService.LogAsync("MASS_UPLOAD", "Shifts", dto.StoreId.ToString(), $"Malla cargada para periodo {start:dd/MM} - {displayEnd:dd/MM}. Pendiente de aprobación.");

        // 6. Notify Approvers based on Configuration (V13.0 Requirement: RH vs Distrital)
        try {
            var currentUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == userClaimId);
            var companyId = currentUser?.CompanyId;
            
            // 6. Enrichment: Fetch Store and Brand details for legible notifications
            var store = await _context.Stores
                .Include(s => s.Brand)
                .FirstOrDefaultAsync(s => s.Id == dto.StoreId);
            
            // 6.1 Get operational settings for the company
            var settings = await _context.OperationalSettings
                .FirstOrDefaultAsync(o => o.CompanyId == companyId);
            
            var approvalMode = settings?.ShiftApprovalMode ?? ShiftApprovalMode.HR;
            var approvers = new List<User>();

            if (approvalMode == ShiftApprovalMode.District) {
                // District Mode: Notify only supervisors/distritales matching the store's district
                if (store != null && store.DistrictId.HasValue) {
                    approvers = await _context.Users
                        .Where(u => u.CompanyId == companyId && u.DistrictId == store.DistrictId && u.IsActive)
                        .ToListAsync();
                }
            } else {
                // HR Mode: Notify ONLY users with the "RH" profile
                approvers = await _context.Users
                    .Include(u => u.Employee)
                        .ThenInclude(e => e.Profile)
                    .Where(u => u.CompanyId == companyId && u.IsActive && 
                                ((u.Employee != null && u.Employee.Profile != null && u.Employee.Profile.Name.ToUpper().Contains("RH")) ||
                                 (u.FullName != null && u.FullName.ToUpper().Contains("RH"))))
                    .ToListAsync();
            }

            // 7. Legible Messaging & Batch Dispatch
            var emails = approvers
                .Where(app => !string.IsNullOrEmpty(app.Email))
                .Select(app => app.Email!)
                .Distinct()
                .ToList();

            if (emails.Any())
            {
                string storeInfo = store != null 
                    ? $"{store.Brand?.Name} - Sede: {store.Name} ({store.ExternalId})" 
                    : dto.StoreId.ToString();

                string emailBody = $"Se ha cargado una nueva programación de turnos para la sede <b>{storeInfo}</b> para el periodo <b>{start:dd/MM}</b> al <b>{displayEnd:dd/MM}</b>.\n\nPor favor, ingresa al panel administrativo para revisarla.";

                // V18.10.X: ELITE RESILIENCE - Use SEND BATCH to avoid 429 Rate Limits
                var emailService = HttpContext.RequestServices.GetRequiredService<IEmailService>();
                await emailService.SendBatchEmailAsync(
                    emails, 
                    "⚠️ Nueva Programación de Turnos para Aprobar", 
                    emailBody
                );
            }
        } catch (Exception ex) {
            Console.WriteLine($"Shift Notification Error (BATCH-RELIANCE): {ex.Message}");
        }

        await _auditService.LogAsync("MASS_UPDATE", "Shifts", dto.StoreId.ToString(), $"Actualizados {dto.Shifts.Count} turnos. Motivo/Comentario: {dto.Comment}");

        return NoContent();
    }

    [HttpPost("individual-justified")]
    public async Task<IActionResult> AddIndividualJustified([FromBody] JustifiedShiftAddDto dto)
    {
        var userClaimIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userClaimIdString)) return Unauthorized();
        var userClaimId = Guid.Parse(userClaimIdString);

        // 1. Basic validation
        if (dto.StartTime.Date < DateTime.Today)
            return BadRequest(new { message = "No se puede agregar turnos en fechas pasadas." });

        if (string.IsNullOrWhiteSpace(dto.Justification) || dto.Justification.Length < 10)
            return BadRequest(new { message = "La justificación debe tener al menos 10 caracteres." });

        // 2. Security Check: Status of the week
        var normalizedStart = GetMondayOfDate(dto.StartTime);
        var approval = await _context.WeeklyApprovals
            .FirstOrDefaultAsync(a => a.StoreId == dto.StoreId && a.WeekStartDate == normalizedStart);

        if (approval == null || approval.Status != WeeklyApprovalStatus.Approved)
            return BadRequest(new { message = "Esta operación solo es válida para semanas ya aprobadas." });

        // 3. Check for existing shift
        var hasExisting = await _context.Shifts
            .AnyAsync(s => s.EmployeeId == dto.EmployeeId && s.StartTime.Date == dto.StartTime.Date);
        
        if (hasExisting)
            return BadRequest(new { message = "El empleado ya tiene un turno asignado para este día." });

        // 4. Perform Addition
        var newShift = new Shift
        {
            EmployeeId = dto.EmployeeId,
            StoreId = dto.StoreId,
            StartTime = DateTime.SpecifyKind(dto.StartTime, DateTimeKind.Unspecified),
            EndTime = DateTime.SpecifyKind(dto.EndTime, DateTimeKind.Unspecified),
            Status = ShiftStatus.Approved, // V13.0 Hot-fix: Added to approved week = Auto-approved
            IsDescanso = dto.IsDescanso,
            IsFuera = dto.IsFuera,
            Observation = $"[JUSTIFICADO] {dto.Justification}",
            CompanyId = Guid.Empty // Set by interceptor
        };

        _context.Shifts.Add(newShift);

        // 5. Audit Trace - LOG THE EXCEPTION WITHOUT REOPENING
        var log = new WeeklyApprovalLog
        {
            WeeklyApproval = approval,
            UserId = userClaimId,
            Action = "MANUAL_FIX",
            Comment = $"ADICIÓN JUSTIFICADA: {dto.Justification}",
            ActionAt = DateTime.UtcNow,
            CompanyId = Guid.Empty // Set by interceptor
        };
        _context.WeeklyApprovalLogs.Add(log);

        await _context.SaveChangesAsync(default);

        return Ok(new { message = "Turno agregado y justificado exitosamente.", shiftId = newShift.Id });
    }

    [HttpGet("my-shifts")]
    public async Task<ActionResult<IEnumerable<ShiftDto>>> GetMyShifts([FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var employee = await _context.Employees.FirstOrDefaultAsync(e => e.UserId == userId);
        
        if (employee == null) return Ok(new List<ShiftDto>());

        var query = _context.Shifts.Where(s => s.EmployeeId == employee.Id);

        if (start.HasValue) 
            query = query.Where(s => s.StartTime >= DateTime.SpecifyKind(start.Value.Date, DateTimeKind.Unspecified));
        
        if (end.HasValue) 
            query = query.Where(s => s.StartTime <= DateTime.SpecifyKind(end.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Unspecified));

        var shifts = await query
            .OrderByDescending(s => s.StartTime)
            .Take(start.HasValue ? 100 : 10) // More context if range provided
            .Select(s => new ShiftDto
            {
                Id = s.Id,
                EmployeeId = s.EmployeeId,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                Status = s.Status,
                IsDescanso = s.IsDescanso,
                IsFuera = s.IsFuera,
                Observation = s.Observation
            })
            .ToListAsync();

        return Ok(shifts);
    }
 
    private DateTime GetMondayOfDate(DateTime date)
    {
        var day = (int)date.DayOfWeek;
        var diff = (day == 0 ? 6 : day - 1);
        return date.Date.AddDays(-diff);
    }
}

public class ShiftDto
{
    public Guid? Id { get; set; }
    public Guid EmployeeId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public ShiftStatus Status { get; set; }
    public bool IsDescanso { get; set; }
    public bool IsFuera { get; set; }
    public string? Observation { get; set; }
}

public class BulkShiftUpdateDto
{
    public Guid StoreId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? Comment { get; set; }
    public List<ShiftDto> Shifts { get; set; } = new();
}

public class JustifiedShiftAddDto
{
    public Guid StoreId { get; set; }
    public Guid EmployeeId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public bool IsDescanso { get; set; }
    public bool IsFuera { get; set; }
    public string Justification { get; set; } = string.Empty;
}
