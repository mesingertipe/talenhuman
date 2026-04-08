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

        // 5. Audit Trace (Replacing previous PUSH logic)
        await _auditService.LogAsync("MASS_UPLOAD", "Shifts", dto.StoreId.ToString(), $"Malla cargada para periodo {start:dd/MM} - {end:dd/MM}. Pendiente de aprobación.");

        // 6. Notify Approvers based on Configuration (V13.0 Requirement: RH vs Distrital)
        try {
            var userClaimIdString = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            var userClaimId = Guid.Parse(userClaimIdString);
            var currentUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == userClaimId);
            var companyId = currentUser?.CompanyId;
            
            // 6.1 Get operational settings for the company
            var settings = await _context.OperationalSettings
                .FirstOrDefaultAsync(o => o.CompanyId == companyId);
            
            var approvalMode = settings?.ShiftApprovalMode ?? ShiftApprovalMode.HR;
            var approvers = new List<User>();

            if (approvalMode == ShiftApprovalMode.District) {
                // District Mode: Only notify Supervisors assigned to that specific store's district
                var store = await _context.Stores.FindAsync(dto.StoreId);
                if (store != null && store.DistrictId.HasValue) {
                    approvers = await _context.Users
                        .Where(u => u.CompanyId == companyId && u.DistrictId == store.DistrictId && u.IsActive)
                        .ToListAsync();
                }
            } else {
                // HR Mode: Notify ONLY the RH team or Admins of the company
                approvers = await _context.Users
                    .Where(u => u.CompanyId == companyId && u.IsActive)
                    .ToListAsync();
            }

            var notificationTasks = approvers
                .Where(app => !string.IsNullOrEmpty(app.Email))
                .Select(app => _notificationService.SendNotificationAsync(new Application.Services.NotificationRequest {
                    To = app.Email,
                    Subject = "⚠️ Nueva Malla de Turnos para Aprobar",
                    Message = $"Se ha cargado una nueva malla de turnos para la tienda '{dto.StoreId}' para el periodo {start:dd/MM} al {end:dd/MM}.\n\nPor favor, ingresa al panel administrativo para revisarla.",
                    Type = Application.Services.NotificationType.Email
                }));

            await Task.WhenAll(notificationTasks);
        } catch (Exception ex) {
            Console.WriteLine($"Shift Notification Error (PARALLEL-EMAIL): {ex.Message}");
        }

        await _auditService.LogAsync("MASS_UPDATE", "Shifts", dto.StoreId.ToString(), $"Actualizados {dto.Shifts.Count} turnos. Motivo/Comentario: {dto.Comment}");

        return NoContent();
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
            query = query.Where(s => s.StartTime >= DateTime.SpecifyKind(start.Value, DateTimeKind.Unspecified));
        
        if (end.HasValue) 
            query = query.Where(s => s.StartTime <= DateTime.SpecifyKind(end.Value, DateTimeKind.Unspecified));

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
