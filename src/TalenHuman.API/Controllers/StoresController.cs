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
    public async Task<ActionResult> GetStores()
    {
        try 
        {
            var companyId = _tenantProvider.GetTenantId();
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
                return Unauthorized();

            var query = _context.Stores.Include(s => s.Brand).Where(s => s.CompanyId == companyId).AsQueryable();

            if (!User.IsInRole("SuperAdmin") && !User.IsInRole("Admin") && !User.IsInRole("RH"))
            {
                if (User.IsInRole("Distrital"))
                {
                    var user = await _context.Users.FindAsync(userId);
                    if (user?.DistrictId != null)
                    {
                        query = query.Where(s => s.DistrictId == user.DistrictId);
                    }
                    else
                    {
                        return Ok(new List<Store>());
                    }
                }
                else // Typical for Gerente or other roles
                {
                    var allowedStoreIds = await _context.Set<SupervisorStore>()
                        .Where(ss => ss.UserId == userId && ss.CompanyId == companyId)
                        .Select(ss => ss.StoreId)
                        .ToListAsync();
                    
                    query = query.Where(s => allowedStoreIds.Contains(s.Id));
                }
            }

            var stores = await query.ToListAsync();
            return Ok(stores);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.ToString());
        }
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
        existing.StoreTypeId = store.StoreTypeId;
        
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
