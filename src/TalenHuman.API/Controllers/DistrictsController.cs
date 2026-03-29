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
public class DistrictsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public DistrictsController(ApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetDistricts()
    {
        var districts = await _context.Districts
            .Include(d => d.Supervisor)
            .Include(d => d.Stores)
            .Select(d => new {
                d.Id,
                d.Name,
                d.SupervisorId,
                SupervisorName = d.Supervisor != null ? d.Supervisor.FullName : null,
                StoreCount = d.Stores.Count,
                StoreNames = d.Stores.Select(s => s.Name).ToList(),
                StoreIds = d.Stores.Select(s => s.Id).ToList()
            })
            .ToListAsync();

        return Ok(districts);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<object>> GetDistrict(Guid id)
    {
        var district = await _context.Districts
            .Include(d => d.Supervisor)
            .Include(d => d.Stores)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (district == null) return NotFound();

        return Ok(new {
            district.Id,
            district.Name,
            district.SupervisorId,
            SupervisorName = district.Supervisor != null ? district.Supervisor.FullName : null,
            StoreIds = district.Stores.Select(s => s.Id).ToList()
        });
    }

    [HttpPost]
    public async Task<ActionResult<District>> CreateDistrict(DistrictDto dto)
    {
        var district = new District
        {
            Name = dto.Name,
            SupervisorId = dto.SupervisorId,
            CompanyId = _tenantProvider.GetTenantId()
        };

        _context.Districts.Add(district);
        await _context.SaveChangesAsync();

        if (dto.StoreIds != null && dto.StoreIds.Any())
        {
            var stores = await _context.Stores.Where(s => dto.StoreIds.Contains(s.Id)).ToListAsync();
            foreach (var store in stores)
            {
                store.DistrictId = district.Id;
            }
            await _context.SaveChangesAsync();
        }

        return CreatedAtAction(nameof(GetDistrict), new { id = district.Id }, district);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateDistrict(Guid id, DistrictDto dto)
    {
        var district = await _context.Districts.Include(d => d.Stores).FirstOrDefaultAsync(d => d.Id == id);
        if (district == null) return NotFound();

        district.Name = dto.Name;
        district.SupervisorId = dto.SupervisorId;

        // Reset existing stores for this district
        var currentStores = await _context.Stores.Where(s => s.DistrictId == id).ToListAsync();
        foreach (var s in currentStores) s.DistrictId = null;

        // Assign new stores
        if (dto.StoreIds != null && dto.StoreIds.Any())
        {
            var newStores = await _context.Stores.Where(s => dto.StoreIds.Contains(s.Id)).ToListAsync();
            foreach (var s in newStores) s.DistrictId = id;
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDistrict(Guid id)
    {
        var district = await _context.Districts.FindAsync(id);
        if (district == null) return NotFound();

        // Detach stores
        var stores = await _context.Stores.Where(s => s.DistrictId == id).ToListAsync();
        foreach (var s in stores) s.DistrictId = null;

        _context.Districts.Remove(district);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public class DistrictDto
{
    public string Name { get; set; } = string.Empty;
    public Guid? SupervisorId { get; set; }
    public List<Guid> StoreIds { get; set; } = new();
}
