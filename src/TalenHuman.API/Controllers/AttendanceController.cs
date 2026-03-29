using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Application.Services;
using TalenHuman.Domain.Entities;

namespace TalenHuman.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AttendanceController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly AttendanceService _attendanceService;

    public AttendanceController(IApplicationDbContext context, AttendanceService attendanceService)
    {
        _context = context;
        _attendanceService = attendanceService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAttendances(DateTime? start, DateTime? end, string? searchTerm)
    {
        var query = _context.Attendances
            .Include(a => a.Employee)
            .Include(a => a.Store)
            .AsQueryable();

        if (start.HasValue)
            query = query.Where(a => a.ClockIn >= start.Value);
        
        if (end.HasValue)
            query = query.Where(a => a.ClockIn <= end.Value);

        var results = await query.ToListAsync();

        if (!string.IsNullOrEmpty(searchTerm))
        {
            results = results.Where(a => 
                a.Employee.FirstName.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ||
                a.Employee.LastName.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ||
                a.Employee.IdentificationNumber.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)
            ).ToList();
        }

        return Ok(results.Select(a => new {
            a.Id,
            EmployeeName = $"{a.Employee.FirstName} {a.Employee.LastName}",
            EmployeeId = a.Employee.IdentificationNumber,
            StoreName = a.Store.Name,
            a.ClockIn,
            a.ClockOut,
            a.Status,
            a.StatusObservation,
            StatusText = a.Status.ToString()
        }));
    }

    [HttpGet("raw")]
    public async Task<IActionResult> GetRawRecords(DateTime? start, DateTime? end, string? searchTerm)
    {
        var query = _context.BiometricRecords.AsQueryable();

        if (start.HasValue)
            query = query.Where(r => r.RecordDate >= start.Value);
        
        if (end.HasValue)
            query = query.Where(r => r.RecordDate <= end.Value);

        var results = await query.OrderByDescending(r => r.RecordDate).ToListAsync();

        return Ok(results);
    }

    [HttpPost("consolidate")]
    public async Task<IActionResult> Consolidate([FromBody] ConsolidateRequest request)
    {
        var companyId = Guid.Parse(User.FindFirst("CompanyId")?.Value ?? Guid.Empty.ToString());
        if (companyId == Guid.Empty) return BadRequest("Company Context Missing");

        var date = request.Date ?? DateTime.Today;
        await _attendanceService.ConsolidateDailyAttendanceAsync(date, companyId);
        
        return Ok(new { Message = $"Proceso de consolidación completado para {date:yyyy-MM-dd}" });
    }

    [HttpPost("cleanup")]
    public async Task<IActionResult> Cleanup()
    {
        var companyId = Guid.Parse(User.FindFirst("CompanyId")?.Value ?? Guid.Empty.ToString());
        if (companyId == Guid.Empty) return BadRequest("Company Context Missing");

        await _attendanceService.CleanupBiometricRecordsAsync(companyId);
        
        return Ok(new { Message = "Remoción de registros biométricos antiguos completada con éxito." });
    }

    public class ConsolidateRequest
    {
        public DateTime? Date { get; set; }
    }
}
