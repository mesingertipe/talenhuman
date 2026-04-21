using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StoreTypesController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public StoreTypesController(IApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<StoreType>>> GetStoreTypes()
    {
        return await _context.StoreTypes
            .Include(st => st.DailyHours)
            .OrderBy(st => st.Name)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<StoreType>> GetStoreType(Guid id)
    {
        var storeType = await _context.StoreTypes
            .Include(st => st.DailyHours)
            .FirstOrDefaultAsync(st => st.Id == id);
            
        if (storeType == null) return NotFound();

        return storeType;
    }

    [HttpPost]
    public async Task<ActionResult<StoreType>> PostStoreType(StoreType storeType)
    {
        var companyId = _tenantProvider.GetTenantId();
        storeType.CompanyId = companyId;
        
        foreach (var dh in storeType.DailyHours)
        {
            dh.CompanyId = companyId;
        }
        
        _context.StoreTypes.Add(storeType);
        await _context.SaveChangesAsync(CancellationToken.None);

        return CreatedAtAction(nameof(GetStoreType), new { id = storeType.Id }, storeType);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutStoreType(Guid id, StoreType storeType)
    {
        var existing = await _context.StoreTypes
            .Include(st => st.DailyHours)
            .FirstOrDefaultAsync(st => st.Id == id);

        if (existing == null) return NotFound();

        existing.Name = storeType.Name;
        existing.IsActive = storeType.IsActive;

        // Sync Daily Hours
        _context.StoreTypeDailyHours.RemoveRange(existing.DailyHours);
        foreach (var dh in storeType.DailyHours)
        {
            existing.DailyHours.Add(new StoreTypeDailyHour
            {
                DayOfWeek = dh.DayOfWeek,
                StartTime = dh.StartTime,
                EndTime = dh.EndTime,
                IsClosed = dh.IsClosed,
                CompanyId = existing.CompanyId
            });
        }

        await _context.SaveChangesAsync(CancellationToken.None);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteStoreType(Guid id)
    {
        var storeType = await _context.StoreTypes
            .Include(st => st.Stores)
            .FirstOrDefaultAsync(st => st.Id == id);

        if (storeType == null)
        {
            return NotFound();
        }

        if (storeType.Stores.Any())
        {
            return BadRequest("No se puede eliminar un tipo de tienda que tiene sedes asociadas.");
        }

        _context.StoreTypes.Remove(storeType);
        await _context.SaveChangesAsync(CancellationToken.None);

        return NoContent();
    }

    private bool StoreTypeExists(Guid id)
    {
        return _context.StoreTypes.Any(e => e.Id == id);
    }
}
