using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Application.Services;
using TalenHuman.Domain.Entities;
using TalenHuman.API.Infrastructure.Security;

namespace TalenHuman.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AttendanceController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly AttendanceService _attendanceService;
    private readonly ITenantTimeProvider _tenantTimeProvider;
    private readonly ITenantProvider _tenantProvider;

    public AttendanceController(IApplicationDbContext context, AttendanceService attendanceService, ITenantTimeProvider tenantTimeProvider, ITenantProvider tenantProvider)
    {
        _context = context;
        _attendanceService = attendanceService;
        _tenantTimeProvider = tenantTimeProvider;
        _tenantProvider = tenantProvider;
    }

    [HttpGet("my-attendance")]
    public async Task<IActionResult> GetMyAttendance()
    {
        var companyId = _tenantProvider.GetTenantId();
        var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var employee = await _context.Employees.FirstOrDefaultAsync(e => e.UserId == userId);
        if (employee == null) return Ok(new List<object>());

        var attendances = await _context.Attendances
            .Include(a => a.Store)
            .Where(a => a.EmployeeId == employee.Id && a.CompanyId == companyId)
            .OrderByDescending(a => a.ClockIn)
            .Take(10)
            .Select(a => new {
                a.Id,
                StoreName = a.Store != null ? a.Store.Name : "N/A",
                a.ClockIn,
                a.ClockOut,
                Status = (int)a.Status,
                StatusText = a.Status == AttendanceStatus.Correcto ? "Correcto" :
                             a.Status == AttendanceStatus.Desfasado ? "Desfase" :
                             a.Status == AttendanceStatus.MarcacionErrada ? "Errada" :
                             a.Status == AttendanceStatus.SinMarcacion ? "Sin Marcación" : "En Curso",
                a.StatusObservation
            })
            .ToListAsync();

        return Ok(attendances);
    }

    [HttpGet("config")]
    public IActionResult GetConfig()
    {
        var tenantNow = _tenantTimeProvider.Now;
        return Ok(new {
            Today = tenantNow.ToString("yyyy-MM-dd"),
            TimeMessage = $"Zona Horaria del Tenant: {tenantNow:yyyy-MM-dd HH:mm:ss}"
        });
    }

    [HttpGet("stats")]
    [AuthorizePermission("OPERATIONS", PermissionAction.Read)]
    public async Task<IActionResult> GetStats(DateTime? start, DateTime? end, Guid? storeId, Guid? brandId, Guid? profileId)
    {
        var companyId = _tenantProvider.GetTenantId();
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
        var roles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(r => r.Value).ToList();

        var tenantToday = _tenantTimeProvider.Now.Date;
        var startDate = start?.Date ?? tenantToday;
        var endDate = end?.Date ?? tenantToday;

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
            var managedStoreIds = new List<Guid>();

            // 1. Stores assigned via SupervisorStores (Direct mapping)
            var directStores = await _context.SupervisorStores
                .IgnoreQueryFilters()
                .Where(ss => ss.UserId == userId)
                .Select(ss => ss.StoreId)
                .ToListAsync();
            managedStoreIds.AddRange(directStores);

            // 2. Stores assigned via District Hierarchy (where user is District Supervisor OR assigned to a District)
            var user = await _context.Users.FindAsync(userId);
            var districtQueries = _context.Districts.AsQueryable();
            
            // Districts where user is the Supervisor
            var managedDistricts = await _context.Districts
                .Where(d => d.SupervisorId == userId || (user != null && d.Id == user.DistrictId))
                .Select(d => d.Id)
                .ToListAsync();

            if (managedDistricts.Any())
            {
                var districtStores = await _context.Stores
                    .Where(s => managedDistricts.Contains(s.DistrictId ?? Guid.Empty))
                    .Select(s => s.Id)
                    .ToListAsync();
                managedStoreIds.AddRange(districtStores);
            }

            managedStoreIds = managedStoreIds.Distinct().ToList();

            if (managedStoreIds.Any())
            {
                employeesQuery = employeesQuery.Where(e => managedStoreIds.Contains(e.StoreId));
                attendanceQuery = attendanceQuery.Where(a => managedStoreIds.Contains(a.StoreId));
                storesQuery = storesQuery.Where(s => managedStoreIds.Contains(s.Id));
            }
            else
            {
                employeesQuery = employeesQuery.Where(e => false);
                attendanceQuery = attendanceQuery.Where(a => false);
                storesQuery = storesQuery.Where(s => false);
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
        var startDate = _tenantTimeProvider.Now.Date.AddDays(-6);
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
         var companyId = _tenantProvider.GetTenantId();
         var date = request.Date ?? _tenantTimeProvider.Now.Date.AddDays(-1);
         
         var reportService = HttpContext.RequestServices.GetRequiredService<AttendanceReportService>();
         await reportService.SendAutomaticDailyReportsAsync(companyId, date);
         
         return Ok(new { Message = "Solicitud de envío de reportes PDF procesada." });
    }

    [HttpGet]
    [AuthorizePermission("OPERATIONS", PermissionAction.Read)]
    public async Task<IActionResult> GetAttendances(DateTime? start, DateTime? end, string? searchTerm)
    {
        var companyId = _tenantProvider.GetTenantId();
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
        var roles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(r => r.Value).ToList();
        
        var query = _context.Attendances
            .Include(a => a.Employee)
            .Include(a => a.Store)
            .Where(a => a.CompanyId == companyId);

        // RBAC Filtering
        if (!roles.Contains("SuperAdmin") && !roles.Contains("Admin") && !roles.Contains("RH"))
        {
            var managedStoreIds = new List<Guid>();
            var directStores = await _context.SupervisorStores.IgnoreQueryFilters().Where(ss => ss.UserId == userId).Select(ss => ss.StoreId).ToListAsync();
            managedStoreIds.AddRange(directStores);

            var user = await _context.Users.FindAsync(userId);
            var managedDistricts = await _context.Districts.Where(d => d.SupervisorId == userId || (user != null && d.Id == user.DistrictId)).Select(d => d.Id).ToListAsync();
            
            if (managedDistricts.Any())
            {
                var districtStores = await _context.Stores.Where(s => managedDistricts.Contains(s.DistrictId ?? Guid.Empty)).Select(s => s.Id).ToListAsync();
                managedStoreIds.AddRange(districtStores);
            }

            managedStoreIds = managedStoreIds.Distinct().ToList();
            query = query.Where(a => managedStoreIds.Contains(a.StoreId));
        }

        if (start.HasValue)
            query = query.Where(a => a.ClockIn >= start.Value.Date);
        
        if (end.HasValue)
            query = query.Where(a => a.ClockIn <= end.Value.Date.AddDays(1).AddTicks(-1));

        var consolidated = await query.ToListAsync();
        
            // Real-Time & Unconsolidated Logic (Extended to requested range)
        var tenantDateNow = _tenantTimeProvider.Now.Date;
        var startFilter = start?.Date ?? tenantDateNow;
        var endFilter = end?.Date ?? tenantDateNow;

        // 1. Fetch Raw Biometric Records in the requested range
        IQueryable<TalenHuman.Domain.Entities.BiometricRecord> rawQuery = _context.BiometricRecords
            .Where(r => r.CompanyId == companyId && r.RecordDate >= startFilter && r.RecordDate <= endFilter.AddDays(1).AddTicks(-1));

        if (roles.Contains("SuperAdmin"))
        {
            rawQuery = _context.BiometricRecords.Where(r => r.RecordDate >= startFilter && r.RecordDate <= endFilter.AddDays(1).AddTicks(-1));
        }

        var rawRecords = await rawQuery.OrderBy(r => r.RecordDate).ToListAsync();

        // 2. Fetch Scheduled Shifts in the requested range
        var shiftsQuery = _context.Shifts
            .Include(s => s.Store)
            .Where(s => s.CompanyId == companyId && s.StartTime >= startFilter && s.StartTime <= endFilter.AddDays(1).AddTicks(-1) && !s.IsDescanso);

        // Apply RBAC to shifts
        if (!roles.Contains("SuperAdmin") && !roles.Contains("Admin") && !roles.Contains("RH"))
        {
            var managedStoreIds = new List<Guid>();
            var directStores = await _context.SupervisorStores.IgnoreQueryFilters().Where(ss => ss.UserId == userId).Select(ss => ss.StoreId).ToListAsync();
            managedStoreIds.AddRange(directStores);
            
            var user = await _context.Users.FindAsync(userId);
            var managedDistricts = await _context.Districts.Where(d => d.SupervisorId == userId || (user != null && d.Id == user.DistrictId)).Select(d => d.Id).ToListAsync();
            if (managedDistricts.Any())
            {
                var districtStores = await _context.Stores.Where(s => managedDistricts.Contains(s.DistrictId ?? Guid.Empty)).Select(s => s.Id).ToListAsync();
                managedStoreIds.AddRange(districtStores);
            }

            managedStoreIds = managedStoreIds.Distinct().ToList();
            shiftsQuery = shiftsQuery.Where(s => managedStoreIds.Contains(s.StoreId));
        }

        var shifts = await shiftsQuery.ToListAsync();

        // 3. Synthesize "Virtual" entries for pending data
        var employeesQuery = _context.Employees.Where(e => e.IsActive && e.CompanyId == companyId);
        
        // RBAC to employees for virtual matching
        if (!roles.Contains("SuperAdmin") && !roles.Contains("Admin") && !roles.Contains("RH"))
        {
            var managedStoreIds = new List<Guid>();
            var directStores = await _context.SupervisorStores.IgnoreQueryFilters().Where(ss => ss.UserId == userId).Select(ss => ss.StoreId).ToListAsync();
            managedStoreIds.AddRange(directStores);

            var user = await _context.Users.FindAsync(userId);
            var managedDistricts = await _context.Districts.Where(d => d.SupervisorId == userId || (user != null && d.Id == user.DistrictId)).Select(d => d.Id).ToListAsync();
            
            if (managedDistricts.Any())
            {
                var districtStores = await _context.Stores.Where(s => managedDistricts.Contains(s.DistrictId ?? Guid.Empty)).Select(s => s.Id).ToListAsync();
                managedStoreIds.AddRange(districtStores);
            }

            managedStoreIds = managedStoreIds.Distinct().ToList();
            employeesQuery = employeesQuery.Where(e => managedStoreIds.Contains(e.StoreId));
        }

        var employees = await employeesQuery.ToListAsync();

        // Match Raw Marks first (IDs that don't match employees or entries not yet consolidated)
        var groupedRaw = rawRecords.GroupBy(r => new { r.DeviceUser, Date = r.RecordDate.Date });
        foreach (var group in groupedRaw)
        {
            var hasConsolidated = consolidated.Any(a => 
                (a.Employee?.IdentificationNumber == group.Key.DeviceUser || a.EmployeeId.ToString() == group.Key.DeviceUser) && 
                a.ClockIn.Date == group.Key.Date);
                
            if (!hasConsolidated)
            {
                var employee = employees.FirstOrDefault(e => 
                    e.IdentificationNumber == group.Key.DeviceUser || 
                    e.IdentificationNumber.TrimStart('0') == group.Key.DeviceUser.TrimStart('0'));
                    
                if (employee == null && !roles.Contains("Admin") && !roles.Contains("SuperAdmin") && !roles.Contains("RH"))
                    continue;
                    
                var store = employee != null ? await _context.Stores.FindAsync(employee.StoreId) : null;
                var allMarks = string.Join(", ", group.OrderBy(r => r.RecordDate).Select(r => r.RecordDate.ToString("HH:mm")));
                
                consolidated.Add(new Attendance {
                    Id = Guid.Empty, 
                    Employee = employee, 
                    EmployeeId = employee?.Id ?? Guid.Empty,
                    CompanyId = employee?.CompanyId ?? companyId, 
                    StoreId = employee?.StoreId ?? Guid.Empty, 
                    Store = store,
                    ClockIn = group.First().RecordDate, 
                    ClockOut = group.Count() > 1 ? group.Last().RecordDate : null,
                    Status = (AttendanceStatus)(-1), 
                    StatusObservation = (employee == null 
                        ? $"[ALERTA] ID {group.Key.DeviceUser} no existe." 
                        : (group.Key.Date < tenantDateNow ? "No Consolidado (Pendiente)" : "Tiempo Real (En curso)")) + $" [Marcaciones: {allMarks}]"
                });
            }
        }
        
        if (!string.IsNullOrEmpty(searchTerm))
        {
            consolidated = consolidated.Where(a => 
                (a.Employee?.FirstName?.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (a.Employee?.LastName?.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (a.Employee?.IdentificationNumber?.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (a.StatusObservation != null && a.StatusObservation.Contains(searchTerm, StringComparison.OrdinalIgnoreCase))
            ).ToList();
        }

        return Ok(consolidated.OrderByDescending(a => a.ClockIn).Select(a => {
            string statusText = "N/A";
            switch(a.Status) {
                case (AttendanceStatus)(-1): statusText = "Tiempo Real"; break;
                case AttendanceStatus.Correcto: statusText = "Correcto"; break;
                case AttendanceStatus.Desfasado: statusText = "Desfase"; break;
                case AttendanceStatus.MarcacionErrada: statusText = "Errada"; break;
                case AttendanceStatus.SinMarcacion: statusText = "Sin Marcación"; break;
            }

            return new {
                a.Id,
                EmployeeName = a.Employee != null ? $"{a.Employee.FirstName} {a.Employee.LastName}" : "N/A",
                EmployeeInternalId = a.EmployeeId,
                EmployeeId = a.Employee?.IdentificationNumber ?? "N/A",
                StoreId = a.StoreId,
                StoreName = a.Store?.Name ?? "N/A",
                a.ShiftId, 
                a.ClockIn, a.ClockOut, Status = (int)a.Status,
                a.StatusObservation,
                StatusText = statusText
            };
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
        var companyId = _tenantProvider.GetTenantId();
        if (companyId == Guid.Empty) return BadRequest(new { Message = "Company Context Missing" });

        var date = request.Date ?? _tenantTimeProvider.Now.Date;
        try 
        {
            await _attendanceService.ConsolidateDailyAttendanceAsync(date, companyId, ExecutionType.Manual);
            return Ok(new { Message = $"Proceso de consolidación completado para {date:yyyy-MM-dd}" });
        }
        catch (Exception ex)
        {
            // The service already logged it to SyncLog, but we return it so the UI shows it nicely.
            return StatusCode(500, new { Message = ex.InnerException?.Message ?? ex.Message });
        }
    }

    [HttpGet("sync-history")]
    public async Task<IActionResult> GetSyncHistory()
    {
        try 
        {
            // AUTO-REPAIR: Ensure schema consistency for PostgreSQL (fixes 42703 error)
            try {
                if (_context is DbContext dbContext)
                {
                    await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"SyncLogs\" ADD COLUMN IF NOT EXISTS \"ProcessedDate\" timestamp with time zone NULL;");
                }
            } catch { /* Silent fail: the query below will throw if truly broken */ }

            var companyId = _tenantProvider.GetTenantId();
            
            var logsData = await _context.SyncLogs
                .Where(l => l.CompanyId == companyId)
                .OrderByDescending(l => l.StartTime)
                .Take(10)
                .ToListAsync();

            var logs = logsData.Select(l => new {
                    l.Id,
                    l.StartTime,
                    l.EndTime,
                    l.Status,
                    l.ErrorMessage,
                    l.RecordsProcessed,
                    ExecutionType = (int)l.ExecutionType,
                    l.ProcessedDate,
                    DurationSeconds = l.EndTime.HasValue 
                        ? (l.EndTime.Value - l.StartTime).TotalSeconds 
                        : (DateTime.UtcNow - l.StartTime).TotalSeconds
                })
                .ToList();
            
            return Ok(logs);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SYNC-HISTORY ERROR]: {ex}");
            return StatusCode(500, new { 
                Message = ex.Message, 
                Detail = ex.InnerException?.Message,
                Type = ex.GetType().Name 
            });
        }
    }

    [HttpPost("cleanup")]
    public async Task<IActionResult> Cleanup()
    {
        var companyId = _tenantProvider.GetTenantId();
        if (companyId == Guid.Empty) return BadRequest("Company Context Missing");

        await _attendanceService.CleanupBiometricRecordsAsync(companyId);
        
        return Ok(new { Message = "Remoción de registros biométricos antiguos completada con éxito." });
    }

    public class ConsolidateRequest
    {
        public DateTime? Date { get; set; }
    }
}
