using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;
using TalenHuman.Domain.Common;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PredictiveHolidaysController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;
    private readonly IPredictiveHolidaysService _holidaysService;

    public PredictiveHolidaysController(
        IApplicationDbContext context, 
        ITenantProvider tenantProvider,
        IPredictiveHolidaysService holidaysService)
    {
        _context = context;
        _tenantProvider = tenantProvider;
        _holidaysService = holidaysService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetHolidays()
    {
        var companyId = _tenantProvider.GetTenantId();
        var company = await _context.Companies.FindAsync(companyId);
        var countryCode = company?.CountryCode ?? "CO";

        // Returns both system holidays for the country and tenant-specific dates
        return await _context.PredictiveSpecialDates
            .Where(d => (d.Country == countryCode && d.IsSystem) || d.CompanyId == companyId)
            .OrderBy(d => d.Date)
            .Select(d => new {
                d.Id,
                d.Date,
                d.Name,
                d.Type,
                IsSystem = d.IsSystem
            })
            .ToListAsync();
    }

    [HttpPost("sync-defaults")]
    public async Task<ActionResult> SyncDefaults()
    {
        var companyId = _tenantProvider.GetTenantId();
        var company = await _context.Companies.FindAsync(companyId);
        var countryCode = company?.CountryCode ?? "CO";

        var currentYear = DateTime.Now.Year;
        var nextYear = currentYear + 1;

        var holidays = new List<PredictiveSpecialDate>();
        holidays.AddRange(_holidaysService.GenerateHolidays(currentYear, countryCode));
        holidays.AddRange(_holidaysService.GenerateHolidays(nextYear, countryCode));

        int createdCount = 0;
        foreach (var h in holidays)
        {
            // Check if already exists for this tenant/country
            var exists = await _context.PredictiveSpecialDates
                .AnyAsync(d => d.Country == countryCode && d.Date == h.Date && d.IsSystem);
            
            if (!exists)
            {
                h.CompanyId = companyId; // Assign to this tenant
                _context.PredictiveSpecialDates.Add(h);
                createdCount++;
            }
        }

        if (createdCount > 0)
        {
            await _context.SaveChangesAsync(CancellationToken.None);
        }

        return Ok(new { message = $"Sincronización completada. {createdCount} festivos nuevos agregados.", count = createdCount });
    }

    [HttpPost]
    public async Task<ActionResult> PostSpecialDate([FromBody] SpecialDateDto dto)
    {
        var companyId = _tenantProvider.GetTenantId();

        var specialDate = new PredictiveSpecialDate
        {
            Date = dto.Date.Date,
            Name = dto.Name,
            Type = dto.Type,
            CompanyId = companyId
        };

        _context.PredictiveSpecialDates.Add(specialDate);
        await _context.SaveChangesAsync(CancellationToken.None);

        return Ok(specialDate);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSpecialDate(Guid id)
    {
        var companyId = _tenantProvider.GetTenantId();
        var specialDate = await _context.PredictiveSpecialDates
            .FirstOrDefaultAsync(d => d.Id == id && d.CompanyId == companyId);

        if (specialDate == null) return NotFound();

        _context.PredictiveSpecialDates.Remove(specialDate);
        await _context.SaveChangesAsync(CancellationToken.None);

        return NoContent();
    }
}

public class SpecialDateDto
{
    public DateTime Date { get; set; }
    public string Name { get; set; } = string.Empty;
    public SpecialDateType Type { get; set; }
}
