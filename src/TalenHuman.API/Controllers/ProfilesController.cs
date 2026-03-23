using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Domain.Entities;
using TalenHuman.Infrastructure.Persistence;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProfilesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ProfilesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Profile>>> GetProfiles()
    {
        return await _context.Profiles.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Profile>> GetProfile(Guid id)
    {
        var profile = await _context.Profiles.FindAsync(id);
        if (profile == null) return NotFound();
        return profile;
    }

    [HttpPost]
    public async Task<ActionResult<Profile>> CreateProfile(Profile profile)
    {
        _context.Profiles.Add(profile);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetProfile), new { id = profile.Id }, profile);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProfile(Guid id, Profile profile)
    {
        if (id != profile.Id) return BadRequest();
        _context.Entry(profile).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProfile(Guid id)
    {
        var profile = await _context.Profiles.FindAsync(id);
        if (profile == null) return NotFound();
        _context.Profiles.Remove(profile);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
