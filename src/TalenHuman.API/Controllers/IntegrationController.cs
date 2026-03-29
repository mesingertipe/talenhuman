using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;
using TalenHuman.Infrastructure.Persistence;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/integration")]
public class IntegrationController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public IntegrationController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost("sync-stores")]
    public async Task<IActionResult> SyncStores([FromBody] List<StoreSyncDto> stores)
    {
        var tenantId = _context.TenantId;
        var results = new SyncResult();

        foreach (var dto in stores)
        {
            var brand = await _context.Brands.FirstOrDefaultAsync(b => b.Name == dto.BrandName);
            if (brand == null)
            {
                results.Failed.Add(new { dto.Code, Error = "Brand not found" });
                continue;
            }

            var store = await _context.Stores
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(s => s.CompanyId == tenantId && (s.Code == dto.Code || s.ExternalId == dto.ExternalId));

            if (store == null)
            {
                store = new Store
                {
                    Code = dto.Code,
                    ExternalId = dto.ExternalId,
                    Name = dto.Name,
                    Address = dto.Address,
                    BiometricId = dto.BiometricId,
                    BrandId = brand.Id,
                    CompanyId = tenantId,
                    IsActive = true
                };
                _context.Stores.Add(store);
                results.Created++;
            }
            else
            {
                store.Name = dto.Name;
                store.Address = dto.Address;
                store.BiometricId = dto.BiometricId;
                store.IsActive = dto.IsActive;
                results.Updated++;
            }
        }

        await _context.SaveChangesAsync();
        return Ok(results);
    }

    [HttpPost("sync-employees")]
    public async Task<IActionResult> SyncEmployees([FromBody] List<EmployeeSyncDto> employees)
    {
        var tenantId = _context.TenantId;
        var results = new SyncResult();

        foreach (var dto in employees)
        {
            var store = await _context.Stores.FirstOrDefaultAsync(s => s.Code == dto.StoreCode || s.Name == dto.StoreName);
            if (store == null)
            {
                results.Failed.Add(new { dto.IdentificationNumber, Error = "Store not found" });
                continue;
            }

            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.Name == dto.ProfileName);
            if (profile == null)
            {
                results.Failed.Add(new { dto.IdentificationNumber, Error = "Profile not found" });
                continue;
            }

            var employee = await _context.Employees
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(e => e.CompanyId == tenantId && e.IdentificationNumber == dto.IdentificationNumber);

            if (employee == null)
            {
                employee = new Employee
                {
                    IdentificationNumber = dto.IdentificationNumber,
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    Email = dto.Email,
                    StoreId = store.Id,
                    ProfileId = profile.Id,
                    DateOfEntry = dto.DateOfEntry ?? DateTime.UtcNow,
                    DailySalary = dto.DailySalary,
                    IsActive = true,
                    CompanyId = tenantId
                };
                _context.Employees.Add(employee);
                results.Created++;
            }
            else
            {
                employee.FirstName = dto.FirstName;
                employee.LastName = dto.LastName;
                employee.Email = dto.Email;
                employee.StoreId = store.Id;
                employee.ProfileId = profile.Id;
                employee.DailySalary = dto.DailySalary;
                employee.IsActive = dto.IsActive;
                results.Updated++;
            }
        }

        await _context.SaveChangesAsync();
        return Ok(results);
    }

    [HttpPost("sync-attendance")]
    public async Task<IActionResult> SyncAttendance([FromBody] List<AttendanceSyncDto> attendances)
    {
        var tenantId = _context.TenantId;
        var results = new SyncResult();

        foreach (var dto in attendances)
        {
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.IdentificationNumber == dto.EmployeeIdentification);
            
            if (employee == null)
            {
                results.Failed.Add(new { dto.EmployeeIdentification, Error = "Employee not found" });
                continue;
            }

            var attendance = new Attendance
            {
                EmployeeId = employee.Id,
                StoreId = employee.StoreId,
                ClockIn = dto.ClockIn,
                ClockOut = dto.ClockOut,
                DeviceId = dto.DeviceId,
                Location = dto.Location,
                CompanyId = tenantId
            };

            _context.Attendances.Add(attendance);
            results.Created++;
        }

        await _context.SaveChangesAsync();
        return Ok(results);
    }

    [HttpPost("sync-biometric")]
    public async Task<IActionResult> SyncBiometric([FromBody] List<BiometricSyncDto> records)
    {
        var tenantId = _context.TenantId;
        var results = new SyncResult();

        foreach (var dto in records)
        {
            var record = new BiometricRecord
            {
                DeviceId = dto.DeviceId,
                DeviceUser = dto.DeviceUser,
                RecordDate = dto.Marcacion,
                CreationDate = dto.CreationDate ?? DateTime.UtcNow,
                RecordDay = DateOnly.FromDateTime(dto.Marcacion),
                RecordTime = TimeOnly.FromDateTime(dto.Marcacion),
                AttendanceStatusId = dto.AttendanceStatusId,
                VerificationModeId = dto.VerificationModeId,
                CompanyId = tenantId
            };

            _context.BiometricRecords.Add(record);
            results.Created++;
        }

        await _context.SaveChangesAsync();
        return Ok(results);
    }
}

public class StoreSyncDto
{
    public string Code { get; set; } = string.Empty;
    public string? ExternalId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? BiometricId { get; set; }
    public string BrandName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public class EmployeeSyncDto
{
    public string IdentificationNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string StoreCode { get; set; } = string.Empty;
    public string StoreName { get; set; } = string.Empty;
    public string ProfileName { get; set; } = string.Empty;
    public DateTime? DateOfEntry { get; set; }
    public decimal DailySalary { get; set; }
    public bool IsActive { get; set; } = true;
}

public class AttendanceSyncDto
{
    public string EmployeeIdentification { get; set; } = string.Empty;
    public DateTime ClockIn { get; set; }
    public DateTime? ClockOut { get; set; }
    public string? DeviceId { get; set; }
    public string? Location { get; set; }
}

public class BiometricSyncDto
{
    public string? DeviceId { get; set; } // identification
    public string? DeviceUser { get; set; } // device_user_id
    public DateTime Marcacion { get; set; } // Full DateTime
    public DateTime? CreationDate { get; set; } // creation_date
    public string? AttendanceStatusId { get; set; }
    public string? VerificationModeId { get; set; }
}

public class SyncResult
{
    public int Created { get; set; }
    public int Updated { get; set; }
    public List<object> Failed { get; set; } = new List<object>();
}
