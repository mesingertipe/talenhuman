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

    public PredictiveHolidaysController(IApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
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
