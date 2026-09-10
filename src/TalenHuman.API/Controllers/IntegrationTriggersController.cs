using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IntegrationTriggersController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public IntegrationTriggersController(IApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<IntegrationTrigger>>> GetTriggers()
    {
        return await _context.IntegrationTriggers.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<IntegrationTrigger>> GetTrigger(Guid id)
    {
        var trigger = await _context.IntegrationTriggers.FindAsync(id);

        if (trigger == null)
        {
            return NotFound();
        }

        return trigger;
    }
    
    [HttpGet("{id}/logs")]
    public async Task<ActionResult<IEnumerable<IntegrationTriggerLog>>> GetTriggerLogs(Guid id)
    {
        var logs = await _context.IntegrationTriggerLogs
            .Where(l => l.IntegrationTriggerId == id)
            .OrderByDescending(l => l.ExecutedAt)
            .Take(10)
            .ToListAsync();

        return logs;
    }

    [HttpPost]
    public async Task<ActionResult<IntegrationTrigger>> PostTrigger(IntegrationTrigger trigger)
    {
        trigger.CompanyId = _tenantProvider.GetTenantId();
        _context.IntegrationTriggers.Add(trigger);
        await _context.SaveChangesAsync(CancellationToken.None);

        return CreatedAtAction(nameof(GetTrigger), new { id = trigger.Id }, trigger);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutTrigger(Guid id, IntegrationTrigger trigger)
    {
        if (id != trigger.Id)
        {
            return BadRequest();
        }

        _context.IntegrationTriggers.Update(trigger);

        try
        {
            await _context.SaveChangesAsync(CancellationToken.None);
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!TriggerExists(id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTrigger(Guid id)
    {
        var trigger = await _context.IntegrationTriggers.FindAsync(id);
        if (trigger == null)
        {
            return NotFound();
        }

        _context.IntegrationTriggers.Remove(trigger);
        await _context.SaveChangesAsync(CancellationToken.None);

        return NoContent();
    }

    private bool TriggerExists(Guid id)
    {
        return _context.IntegrationTriggers.Any(e => e.Id == id);
    }
}
