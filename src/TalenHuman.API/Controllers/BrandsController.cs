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
public class BrandsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;
    private readonly IAuditService _auditService;

    public BrandsController(ApplicationDbContext context, ITenantProvider tenantProvider, IAuditService auditService)
    {
        _context = context;
        _tenantProvider = tenantProvider;
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Brand>>> GetBrands()
    {
        return await _context.Brands.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Brand>> GetBrand(Guid id)
    {
        var brand = await _context.Brands.FindAsync(id);
        if (brand == null) return NotFound();
        return brand;
    }

    [HttpPost]
    public async Task<ActionResult<Brand>> CreateBrand(Brand brand)
    {
        brand.CompanyId = _tenantProvider.GetTenantId();
        _context.Brands.Add(brand);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync("CREATE", "Brand", brand.Id.ToString(), $"Creada marca: {brand.Name}");

        return CreatedAtAction(nameof(GetBrand), new { id = brand.Id }, brand);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBrand(Guid id, Brand brand)
    {
        var existing = await _context.Brands.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Name = brand.Name;
        
        await _context.SaveChangesAsync();

        await _auditService.LogAsync("UPDATE", "Brand", existing.Id.ToString(), $"Actualizada marca: {brand.Name}");

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBrand(Guid id)
    {
        var brand = await _context.Brands.FindAsync(id);
        if (brand == null) return NotFound();

        try
        {
            _context.Brands.Remove(brand);
            await _context.SaveChangesAsync();

            await _auditService.LogAsync("DELETE", "Brand", id.ToString(), $"Eliminada marca: {brand.Name}");

            return NoContent();
        }
        catch (DbUpdateException)
        {
            return BadRequest(new { message = "No se puede eliminar la marca porque tiene registros asociados." });
        }
    }
}
