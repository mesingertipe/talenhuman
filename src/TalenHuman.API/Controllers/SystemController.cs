using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Infrastructure.Persistence;

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
}
