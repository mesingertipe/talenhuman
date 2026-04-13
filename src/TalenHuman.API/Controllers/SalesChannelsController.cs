using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;
using TalenHuman.Domain.Common;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/sales/channels")]
public class SalesChannelsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public SalesChannelsController(IApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SalesChannel>>> GetChannels()
    {
        var companyId = _tenantProvider.GetTenantId();
        return await _context.SalesChannels
            .Where(c => c.CompanyId == companyId)
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<SalesChannel>> PostChannel(SalesChannel channel)
    {
        var companyId = _tenantProvider.GetTenantId();
        channel.CompanyId = companyId;
        
        _context.SalesChannels.Add(channel);
        await _context.SaveChangesAsync(CancellationToken.None);

        return Ok(channel);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutChannel(Guid id, SalesChannel channel)
    {
        if (id != channel.Id) return BadRequest();

        var existing = await _context.SalesChannels.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Name = channel.Name;
        existing.Description = channel.Description;
        existing.IsActive = channel.IsActive;

        await _context.SaveChangesAsync(CancellationToken.None);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteChannel(Guid id)
    {
        var channel = await _context.SalesChannels.FindAsync(id);
        if (channel == null) return NotFound();

        _context.SalesChannels.Remove(channel);
        await _context.SaveChangesAsync(CancellationToken.None);

        return NoContent();
    }
}
