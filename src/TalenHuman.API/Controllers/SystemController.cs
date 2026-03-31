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

    // --- Modular Architecture Endpoints ---

    [HttpGet("modules")]
    public async Task<IActionResult> GetModules()
    {
        var modules = await _context.Modules.OrderBy(m => m.DisplayOrder).ToListAsync();
        return Ok(modules);
    }

    [HttpGet("companies/{id}/modules")]
    public async Task<IActionResult> GetCompanyModules(Guid id)
    {
        var activeModules = await _context.CompanyModules
            .IgnoreQueryFilters()
            .Where(cm => cm.CompanyId == id && cm.IsActive)
            .Select(cm => cm.ModuleId)
            .ToListAsync();
        return Ok(activeModules);
    }

    [HttpPost("companies/{id}/modules")]
    public async Task<IActionResult> UpdateCompanyModules(Guid id, [FromBody] List<Guid> moduleIds)
    {
        var existing = await _context.CompanyModules
            .IgnoreQueryFilters()
            .Where(cm => cm.CompanyId == id)
            .ToListAsync();
        
        // Deactivate removed
        foreach (var ex in existing.Where(e => !moduleIds.Contains(e.ModuleId)))
        {
            ex.IsActive = false;
        }

        // Activate or create new
        foreach (var mid in moduleIds)
        {
            var ex = existing.FirstOrDefault(e => e.ModuleId == mid);
            if (ex != null) ex.IsActive = true;
            else _context.CompanyModules.Add(new CompanyModule { CompanyId = id, ModuleId = mid, IsActive = true });
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("permissions/{companyId}")]
    public async Task<IActionResult> GetPermissions(Guid companyId)
    {
        var perms = await _context.ModulePermissions
            .IgnoreQueryFilters()
            .Where(p => p.CompanyId == companyId)
            .Select(p => new {
                p.Id,
                p.RoleId,
                p.ModuleId,
                p.Action,
                p.IsAllowed
            })
            .ToListAsync();
        return Ok(perms);
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _context.Roles
            .Select(r => new { r.Id, r.Name })
            .ToListAsync();
        return Ok(roles);
    }

    [HttpPost("permissions")]
    public async Task<IActionResult> UpdatePermission([FromBody] UpdatePermissionDto dto)
    {
        var perm = await _context.ModulePermissions
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.CompanyId == dto.CompanyId && p.RoleId == dto.RoleId && p.ModuleId == dto.ModuleId && p.Action == dto.Action);

        if (perm != null)
        {
            perm.IsAllowed = dto.IsAllowed;
        }
        else
        {
            perm = new ModulePermission
            {
                CompanyId = dto.CompanyId,
                RoleId = dto.RoleId,
                ModuleId = dto.ModuleId,
                Action = dto.Action,
                IsAllowed = dto.IsAllowed
            };
            _context.ModulePermissions.Add(perm);
        }

        await _context.SaveChangesAsync();
        return Ok(perm);
    }
}

public class UpdatePermissionDto
{
    public Guid CompanyId { get; set; }
    public Guid RoleId { get; set; }
    public Guid ModuleId { get; set; }
    public PermissionAction Action { get; set; }
    public bool IsAllowed { get; set; }
}

public class ApiKeyDto
{
    public Guid CompanyId { get; set; }
    public string Description { get; set; } = string.Empty;
}
