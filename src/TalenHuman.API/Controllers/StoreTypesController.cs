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
        if (id != storeType.Id)
        {
            return BadRequest("El ID de la ruta no coincide con el ID del cuerpo.");
        }

        try
        {
            // 1. Load Parent ONLY (No Include to avoid tracker collisions)
            var existing = await _context.StoreTypes
                .FirstOrDefaultAsync(st => st.Id == id);

            if (existing == null) return NotFound("Formato de tienda no encontrado.");

            // 2. Update Parent properties
            existing.Name = storeType.Name;
            existing.IsActive = storeType.IsActive;
            existing.Description = storeType.Description;

            // 3. Absolute Cleanup: Direct SQL Delete ignoring filters to avoid orphans/concurrency errors
            await _context.StoreTypeDailyHours
                .IgnoreQueryFilters()
                .Where(dh => dh.StoreTypeId == id)
                .ExecuteDeleteAsync();

            // 4. Atomic Insertion of fresh records
            if (storeType.DailyHours != null)
            {
                foreach (var dh in storeType.DailyHours)
                {
                    _context.StoreTypeDailyHours.Add(new StoreTypeDailyHour
                    {
                        DayOfWeek = dh.DayOfWeek,
                        StartTime = dh.StartTime ?? "08:00",
                        EndTime = dh.EndTime ?? "17:00",
                        IsClosed = dh.IsClosed,
                        CompanyId = existing.CompanyId,
                        StoreTypeId = existing.Id
                    });
                }
            }

            await _context.SaveChangesAsync(CancellationToken.None);
            return NoContent();
        }
        catch (DbUpdateException ex)
        {
            var inner = ex.InnerException?.Message ?? ex.Message;
            return StatusCode(500, new { error = "Fallo en persistencia aislada (DB)", detail = inner });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal Server Exception", detail = ex.Message });
        }
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
