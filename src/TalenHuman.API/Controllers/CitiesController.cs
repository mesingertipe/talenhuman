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
public class CitiesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public CitiesController(ApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<City>>> GetCities()
    {
        return await _context.Cities.OrderBy(c => c.Name).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<City>> GetCity(Guid id)
    {
        var city = await _context.Cities.FindAsync(id);
        if (city == null) return NotFound();
        return city;
    }

    [HttpPost]
    public async Task<ActionResult<City>> CreateCity(City city)
    {
        city.CompanyId = _tenantProvider.GetTenantId();
        _context.Cities.Add(city);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetCity), new { id = city.Id }, city);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCity(Guid id, City city)
    {
        var existing = await _context.Cities.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Name = city.Name;
        
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCity(Guid id)
    {
        var city = await _context.Cities.Include(c => c.Stores).FirstOrDefaultAsync(c => c.Id == id);
        if (city == null) return NotFound();

        if (city.Stores.Any())
        {
            return BadRequest(new { message = "No se puede eliminar la ciudad porque tiene tiendas asociadas." });
        }

        _context.Cities.Remove(city);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
