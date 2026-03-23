using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Domain.Entities;
using TalenHuman.Infrastructure.Persistence;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StoresController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public StoresController(ApplicationDbContext context)
    {
        _context = context;
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
        _context.Stores.Add(store);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetStore), new { id = store.Id }, store);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateStore(Guid id, Store store)
    {
        if (id != store.Id) return BadRequest();
        _context.Entry(store).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteStore(Guid id)
    {
        var store = await _context.Stores.FindAsync(id);
        if (store == null) return NotFound();
        _context.Stores.Remove(store);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
