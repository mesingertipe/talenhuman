using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;
using TalenHuman.Domain.Common;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/sales/time-bands")]
public class SalesTimeBandsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public SalesTimeBandsController(IApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SalesTimeBand>>> GetBands()
    {
        var companyId = _tenantProvider.GetTenantId();
        return await _context.SalesTimeBands
            .Where(b => b.CompanyId == companyId)
            .OrderBy(b => b.StartTime)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<SalesTimeBand>> PostBand(SalesTimeBand band)
    {
        var companyId = _tenantProvider.GetTenantId();
        band.CompanyId = companyId;
        
        _context.SalesTimeBands.Add(band);
        await _context.SaveChangesAsync(CancellationToken.None);

        return Ok(band);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutBand(Guid id, SalesTimeBand band)
    {
        if (id != band.Id) return BadRequest();

        var existing = await _context.SalesTimeBands.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Name = band.Name;
        existing.StartTime = band.StartTime;
        existing.EndTime = band.EndTime;
        existing.Color = band.Color;
        existing.IsActive = band.IsActive;

        await _context.SaveChangesAsync(CancellationToken.None);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBand(Guid id)
    {
        var band = await _context.SalesTimeBands.FindAsync(id);
        if (band == null) return NotFound();

        _context.SalesTimeBands.Remove(band);
        await _context.SaveChangesAsync(CancellationToken.None);

        return NoContent();
    }
}
