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

namespace TalenHuman.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ShiftsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public ShiftsController(IApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
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

        // 3. Get existing shifts in the range to remove
        var existingShifts = await _context.Shifts
            .Where(s => s.StoreId == dto.StoreId && s.StartTime >= start && s.StartTime <= end)
            .ToListAsync();

        _context.Shifts.RemoveRange(existingShifts);

        // 4. Add new ones
        foreach (var sDto in dto.Shifts)
        {
            _context.Shifts.Add(new Shift
            {
                EmployeeId = sDto.EmployeeId,
                StoreId = dto.StoreId,
                StartTime = DateTime.SpecifyKind(sDto.StartTime, DateTimeKind.Unspecified),
                EndTime = DateTime.SpecifyKind(sDto.EndTime, DateTimeKind.Unspecified),
                Status = sDto.Status,
                IsDescanso = sDto.IsDescanso,
                IsFuera = sDto.IsFuera,
                Observation = dto.Comment, // Use the bulk comment
                CompanyId = Guid.Empty // Set by interceptor usually
            });
        }

        await _context.SaveChangesAsync(default);

        await _auditService.LogAsync("MASS_UPDATE", "Shifts", dto.StoreId.ToString(), $"Actualizados {dto.Shifts.Count} turnos. Motivo/Comentario: {dto.Comment}");

        return NoContent();
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
