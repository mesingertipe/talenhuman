using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Infrastructure.Persistence;
using TalenHuman.Domain.Entities;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SystemController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SystemController> _logger;

    public SystemController(ApplicationDbContext context, ILogger<SystemController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("force-db-sync-elite-v12")]
    public async Task<IActionResult> ForceMigration()
    {
        try
        {
            var pending = await _context.Database.GetPendingMigrationsAsync();
            var count = pending.Count();

            if (count > 0)
            {
                _logger.LogInformation("Forcing {Count} migrations: {Migrations}", count, string.Join(", ", pending));
                await _context.Database.MigrateAsync();
                return Ok(new { message = "Migraciones aplicadas con éxito.", applied = pending });
            }

            return Ok(new { message = "La base de datos ya está al día. No hay migraciones pendientes." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error forzando migración");
            return StatusCode(500, new { error = ex.Message, detail = ex.InnerException?.Message });
        }
    }

    [HttpGet("api-keys")]
    public async Task<IActionResult> GetApiKeys()
    {
        var keys = await _context.ApiKeys
            .IgnoreQueryFilters()
            .Include(a => a.Company)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new {
                a.Id,
                a.Key,
                a.Description,
                a.IsActive,
                a.CreatedAt,
                a.CompanyId,
                CompanyName = a.Company != null ? a.Company.Name : "N/A"
            })
            .ToListAsync();
        return Ok(keys);
    }

    [HttpPost("api-keys")]
    public async Task<IActionResult> CreateApiKey([FromBody] ApiKeyDto dto)
    {
        var key = new ApiKey
        {
            Key = "th_" + Guid.NewGuid().ToString("N"),
            Description = dto.Description,
            CompanyId = dto.CompanyId,
            IsActive = true
        };

        _context.ApiKeys.Add(key);
        await _context.SaveChangesAsync();
        return Ok(key);
    }

    [HttpDelete("api-keys/{id}")]
    public async Task<IActionResult> DeleteApiKey(Guid id)
    {
        var key = await _context.ApiKeys.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.Id == id);
        if (key == null) return NotFound();

        _context.ApiKeys.Remove(key);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public class ApiKeyDto
{
    public Guid CompanyId { get; set; }
    public string Description { get; set; } = string.Empty;
}
