using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;
using TalenHuman.Infrastructure.Persistence;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StoresController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;
    private readonly IAuditService _auditService;

    public StoresController(ApplicationDbContext context, ITenantProvider tenantProvider, IAuditService auditService)
    {
        _context = context;
        _tenantProvider = tenantProvider;
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Store>>> GetStores()
    {
        return await _context.Stores.Include(s => s.Brand).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Store>> GetStore(Guid id)
    {
        var store = await _context.Stores.Include(s => s.Brand).FirstOrDefaultAsync(s => s.Id == id);
        if (store == null) return NotFound();
        return store;
    }

    [HttpPost]
    public async Task<ActionResult<Store>> CreateStore(Store store)
    {
        store.CompanyId = _tenantProvider.GetTenantId();
        _context.Stores.Add(store);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync("CREATE", "Store", store.Id.ToString(), $"Creada tienda: {store.Name}");

        return CreatedAtAction(nameof(GetStore), new { id = store.Id }, store);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateStore(Guid id, Store store)
    {
        var existing = await _context.Stores.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Name = store.Name;
        existing.Address = store.Address;
        existing.BrandId = store.BrandId;
        existing.CityId = store.CityId;
        existing.ExternalId = store.ExternalId;
        existing.BiometricId = store.BiometricId;
        existing.DistrictId = store.DistrictId;
        existing.IsActive = store.IsActive;
        
        // Operational Settings
        existing.UseSequentialPairing = store.UseSequentialPairing;
        existing.OperationalDayStart = store.OperationalDayStart;
        existing.DefaultStartTime = store.DefaultStartTime;
        existing.DefaultEndTime = store.DefaultEndTime;
        
        await _context.SaveChangesAsync();

        await _auditService.LogAsync("UPDATE", "Store", existing.Id.ToString(), $"Actualizada tienda: {store.Name}");

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteStore(Guid id)
    {
        var store = await _context.Stores.FindAsync(id);
        if (store == null) return NotFound();

        try
        {
            _context.Stores.Remove(store);
            await _context.SaveChangesAsync();

            await _auditService.LogAsync("DELETE", "Store", id.ToString(), $"Eliminada tienda: {store.Name}");

            return NoContent();
        }
        catch (DbUpdateException)
        {
            return BadRequest(new { message = "No se puede eliminar la tienda porque tiene registros asociados." });
        }
    }
}
