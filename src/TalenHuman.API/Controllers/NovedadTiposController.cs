using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TalenHuman.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NovedadTiposController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public NovedadTiposController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<NovedadTipoDto>>> GetNovedadTipos([FromQuery] bool includeTemplates = true)
    {
        var query = _context.NovedadTipos.AsQueryable();

        if (!includeTemplates)
        {
            query = query.Where(n => !n.EsPlantilla);
        }

        return await query
            .Select(n => new NovedadTipoDto
            {
                Id = n.Id,
                Nombre = n.Nombre,
                Descripcion = n.Descripcion,
                RequiereAdjunto = n.RequiereAdjunto,
                CamposConfig = n.CamposConfig,
                Categoria = (int)n.Categoria,
                RolAprobador = n.RolAprobador,
                EsPlantilla = n.EsPlantilla,
                PermiteCreacionEmpleado = n.PermiteCreacionEmpleado,
                IsSystem = n.IsSystem
            })
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<NovedadTipoDto>> GetNovedadTipo(Guid id)
    {
        var n = await _context.NovedadTipos.FindAsync(id);
        if (n == null) return NotFound();

        return new NovedadTipoDto
        {
            Id = n.Id,
            Nombre = n.Nombre,
            Descripcion = n.Descripcion,
            RequiereAdjunto = n.RequiereAdjunto,
            CamposConfig = n.CamposConfig,
            Categoria = (int)n.Categoria,
            RolAprobador = n.RolAprobador,
            EsPlantilla = n.EsPlantilla,
            PermiteCreacionEmpleado = n.PermiteCreacionEmpleado,
            IsSystem = n.IsSystem
        };
    }

    [HttpPost]
    public async Task<ActionResult<NovedadTipoDto>> CreateNovedadTipo(NovedadTipoDto dto)
    {
        if (dto.Nombre.Trim().Equals("Vacaciones", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "No se puede crear un tipo de novedad con el nombre 'Vacaciones' porque es un módulo del sistema." });
        }

        var n = new NovedadTipo
        {
            Nombre = dto.Nombre,
            Descripcion = dto.Descripcion,
            RequiereAdjunto = dto.RequiereAdjunto,
            CamposConfig = dto.CamposConfig,
            Categoria = (NovedadCategoria)dto.Categoria,
            RolAprobador = dto.RolAprobador,
            EsPlantilla = User.IsInRole("SuperAdmin") && dto.EsPlantilla,
            PermiteCreacionEmpleado = dto.PermiteCreacionEmpleado,
            IsSystem = false
        };

        _context.NovedadTipos.Add(n);
        await _context.SaveChangesAsync(default);

        dto.Id = n.Id;
        return CreatedAtAction(nameof(GetNovedadTipo), new { id = n.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateNovedadTipo(Guid id, NovedadTipoDto dto)
    {
        var n = await _context.NovedadTipos.FindAsync(id);
        if (n == null) return NotFound();

        if (n.IsSystem && !n.Nombre.Equals(dto.Nombre, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "No se puede cambiar el nombre de un tipo de novedad del sistema." });
        }

        n.Nombre = dto.Nombre;
        n.Descripcion = dto.Descripcion;
        n.RequiereAdjunto = dto.RequiereAdjunto;
        n.CamposConfig = dto.CamposConfig;
        n.Categoria = (NovedadCategoria)dto.Categoria;
        n.RolAprobador = dto.RolAprobador;
        n.PermiteCreacionEmpleado = dto.PermiteCreacionEmpleado;
        
        if (User.IsInRole("SuperAdmin"))
        {
            n.EsPlantilla = dto.EsPlantilla;
        }

        await _context.SaveChangesAsync(default);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNovedadTipo(Guid id)
    {
        var n = await _context.NovedadTipos.FindAsync(id);
        if (n == null) return NotFound();

        if (n.IsSystem)
        {
            return BadRequest("No se puede eliminar un tipo de novedad nativo del sistema.");
        }

        // Check if there are news records using this type
        var hasNews = await _context.Novedades.AnyAsync(x => x.NovedadTipoId == id);
        if (hasNews)
        {
            return BadRequest("No se puede eliminar el tipo de novedad porque ya tiene registros asociados.");
        }

        _context.NovedadTipos.Remove(n);
        await _context.SaveChangesAsync(default);
        return NoContent();
    }

    [HttpPost("import-template/{id}")]
    public async Task<ActionResult<NovedadTipoDto>> ImportTemplate(Guid id)
    {
        // IgnoreQueryFilters to find the template even if it belongs to another company (though EsPlantilla bypasses filter)
        var template = await _context.NovedadTipos.IgnoreQueryFilters().FirstOrDefaultAsync(n => n.Id == id && n.EsPlantilla);
        if (template == null) return NotFound("Plantilla no encontrada.");

        var newType = new NovedadTipo
        {
            Nombre = template.Nombre + " (Copia)",
            Descripcion = template.Descripcion,
            RequiereAdjunto = template.RequiereAdjunto,
            CamposConfig = template.CamposConfig,
            Categoria = template.Categoria,
            RolAprobador = template.RolAprobador,
            EsPlantilla = false, // Imported version is NOT a template
            PermiteCreacionEmpleado = template.PermiteCreacionEmpleado,
            IsSystem = false
        };

        _context.NovedadTipos.Add(newType);
        await _context.SaveChangesAsync(default);

        return Ok(new NovedadTipoDto
        {
            Id = newType.Id,
            Nombre = newType.Nombre,
            Descripcion = newType.Descripcion,
            RequiereAdjunto = newType.RequiereAdjunto,
            CamposConfig = newType.CamposConfig,
            Categoria = (int)newType.Categoria,
            RolAprobador = newType.RolAprobador,
            EsPlantilla = false,
            PermiteCreacionEmpleado = newType.PermiteCreacionEmpleado,
            IsSystem = false
        });
    }
}

public class NovedadTipoDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool RequiereAdjunto { get; set; } = true;
    public string? CamposConfig { get; set; } // JSON
    public int Categoria { get; set; }
    public string RolAprobador { get; set; } = "Admin";
    public bool EsPlantilla { get; set; }
    public bool PermiteCreacionEmpleado { get; set; }
    public bool IsSystem { get; set; }
}
