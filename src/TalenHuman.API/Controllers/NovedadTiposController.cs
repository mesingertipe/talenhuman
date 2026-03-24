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
    public async Task<ActionResult<IEnumerable<NovedadTipoDto>>> GetNovedadTipos()
    {
        return await _context.NovedadTipos
            .Select(n => new NovedadTipoDto
            {
                Id = n.Id,
                Nombre = n.Nombre,
                Descripcion = n.Descripcion,
                RequiereAdjunto = n.RequiereAdjunto,
                CamposConfig = n.CamposConfig,
                Categoria = (int)n.Categoria,
                RolAprobador = n.RolAprobador
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
            RolAprobador = n.RolAprobador
        };
    }

    [HttpPost]
    public async Task<ActionResult<NovedadTipoDto>> CreateNovedadTipo(NovedadTipoDto dto)
    {
        var n = new NovedadTipo
        {
            Nombre = dto.Nombre,
            Descripcion = dto.Descripcion,
            RequiereAdjunto = dto.RequiereAdjunto,
            CamposConfig = dto.CamposConfig,
            Categoria = (NovedadCategoria)dto.Categoria,
            RolAprobador = dto.RolAprobador
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

        n.Nombre = dto.Nombre;
        n.Descripcion = dto.Descripcion;
        n.RequiereAdjunto = dto.RequiereAdjunto;
        n.CamposConfig = dto.CamposConfig;
        n.Categoria = (NovedadCategoria)dto.Categoria;
        n.RolAprobador = dto.RolAprobador;

        await _context.SaveChangesAsync(default);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNovedadTipo(Guid id)
    {
        var n = await _context.NovedadTipos.FindAsync(id);
        if (n == null) return NotFound();

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
}
