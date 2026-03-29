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

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(DateTime? start, DateTime? end, Guid? storeId, Guid? brandId, Guid? profileId)
    {
        var companyId = Guid.Parse(User.FindFirst("CompanyId")?.Value ?? Guid.Empty.ToString());
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
        var roles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(r => r.Value).ToList();

        var startDate = start?.Date ?? DateTime.Today.Date;
        var endDate = end?.Date ?? DateTime.Today.Date;

        var employeesQuery = _context.Employees.Where(e => e.CompanyId == companyId && e.IsActive);
        var attendanceQuery = _context.Attendances.Where(a => a.CompanyId == companyId && a.ClockIn.Date >= startDate && a.ClockIn.Date <= endDate);
        var storesQuery = _context.Stores.Where(s => s.CompanyId == companyId && s.IsActive);
        var brandsQuery = _context.Brands.Where(b => b.CompanyId == companyId && b.IsActive);

        // Entity Filters
        if (storeId.HasValue)
        {
            employeesQuery = employeesQuery.Where(e => e.StoreId == storeId.Value);
            attendanceQuery = attendanceQuery.Where(a => a.StoreId == storeId.Value);
        }

        if (brandId.HasValue)
        {
            employeesQuery = employeesQuery.Where(e => e.Store.BrandId == brandId.Value);
            attendanceQuery = attendanceQuery.Where(a => a.Store.BrandId == brandId.Value);
            storesQuery = storesQuery.Where(s => s.BrandId == brandId.Value);
        }

        if (profileId.HasValue)
        {
            employeesQuery = employeesQuery.Where(e => e.ProfileId == profileId.Value);
            attendanceQuery = attendanceQuery.Where(a => a.Employee.ProfileId == profileId.Value);
        }

        // RBAC: Filter by Managed Stores for Managers and Supervisors
        if (!roles.Contains("SuperAdmin") && !roles.Contains("Admin") && !roles.Contains("RH"))
        {
            if (roles.Contains("Supervisor") || roles.Contains("Gerente"))
            {
                var managedStores = await _context.SupervisorStores
                    .Where(ss => ss.UserId == userId)
                    .Select(ss => ss.StoreId)
                    .ToListAsync();
                
                employeesQuery = employeesQuery.Where(e => managedStores.Contains(e.StoreId));
                attendanceQuery = attendanceQuery.Where(a => managedStores.Contains(a.StoreId));
                storesQuery = storesQuery.Where(s => managedStores.Contains(s.Id));
            }
            else if (roles.Contains("Distrital"))
            {
                var user = await _context.Users.FindAsync(userId);
                if (user?.DistrictId != null)
                {
                    attendanceQuery = attendanceQuery.Where(a => a.Store.DistrictId == user.DistrictId);
                    employeesQuery = employeesQuery.Where(e => e.Store.DistrictId == user.DistrictId);
                    storesQuery = storesQuery.Where(s => s.DistrictId == user.DistrictId);
                }
            }
        }

        var totalEmployees = await employeesQuery.CountAsync();
        var totalStores = await storesQuery.CountAsync();
        var totalBrands = await brandsQuery.CountAsync();
        var attendances = await attendanceQuery.ToListAsync();

        return Ok(new {
            TotalEmployees = totalEmployees,
            TotalStores = totalStores,
            TotalBrands = totalBrands,
            Correct = attendances.Count(a => a.Status == AttendanceStatus.Correcto),
            Errada = attendances.Count(a => a.Status == AttendanceStatus.MarcacionErrada),
            Desfasado = attendances.Count(a => a.Status == AttendanceStatus.Desfasado),
            SinMarcacion = attendances.Count(a => a.Status == AttendanceStatus.SinMarcacion),
            History = await GetHistory(companyId, userId, roles)
        });
    }

    private async Task<object> GetHistory(Guid companyId, Guid userId, List<string> roles)
    {
        // Return stats for the last 7 days for charts
        var startDate = DateTime.Today.AddDays(-6);
        var query = _context.Attendances.Where(a => a.CompanyId == companyId && a.ClockIn >= startDate);

        // Apply same RBAC filters (simplified for brevity)
        if (roles.Contains("Gerente"))
        {
             var managedStores = await _context.SupervisorStores.Where(ss => ss.UserId == userId).Select(ss => ss.StoreId).ToListAsync();
             query = query.Where(a => managedStores.Contains(a.StoreId));
        }

        var history = await query.ToListAsync();
        return history.GroupBy(a => a.ClockIn.Date)
            .Select(g => new {
                Date = g.Key.ToString("yyyy-MM-dd"),
                CorrectO = g.Count(x => x.Status == AttendanceStatus.Correcto),
                Errors = g.Count(x => x.Status == AttendanceStatus.MarcacionErrada || x.Status == AttendanceStatus.SinMarcacion)
            }).OrderBy(x => x.Date).ToList();
    }

    [HttpPost("send-report")]
    public async Task<IActionResult> SendReport([FromBody] ConsolidateRequest request)
    {
         var companyId = Guid.Parse(User.FindFirst("CompanyId")?.Value ?? Guid.Empty.ToString());
         var date = request.Date ?? DateTime.Today.AddDays(-1);
         
         var reportService = HttpContext.RequestServices.GetRequiredService<AttendanceReportService>();
         await reportService.SendAutomaticDailyReportsAsync(companyId, date);
         
         return Ok(new { Message = "Solicitud de envío de reportes PDF procesada." });
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

    [HttpGet("sync-history")]
    public async Task<IActionResult> GetSyncHistory()
    {
        var companyId = Guid.Parse(User.FindFirst("CompanyId")?.Value ?? Guid.Empty.ToString());
        var logs = await _context.SyncLogs
            .Where(l => l.CompanyId == companyId)
            .OrderByDescending(l => l.StartTime)
            .Take(10)
            .ToListAsync();
        
        return Ok(logs);
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
