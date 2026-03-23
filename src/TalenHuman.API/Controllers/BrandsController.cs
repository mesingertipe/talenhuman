using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Domain.Entities;
using TalenHuman.Infrastructure.Persistence;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BrandsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public BrandsController(ApplicationDbContext context)
    {
        _context = context;
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
        _context.Brands.Add(brand);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetBrand), new { id = brand.Id }, brand);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBrand(Guid id, Brand brand)
    {
        if (id != brand.Id) return BadRequest();
        _context.Entry(brand).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBrand(Guid id)
    {
        var brand = await _context.Brands.FindAsync(id);
        if (brand == null) return NotFound();
        _context.Brands.Remove(brand);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
