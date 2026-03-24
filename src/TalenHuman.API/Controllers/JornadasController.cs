using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;
using TalenHuman.Domain.Common;

namespace TalenHuman.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class JornadasController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public JornadasController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<JornadaDto>>> GetJornadas()
    {
        return await _context.Jornadas
            .Select(j => new JornadaDto
            {
                Id = j.Id,
                Nombre = j.Nombre,
                HorasDiarias = j.HorasDiarias,
                HorasSemanales = j.HorasSemanales
            })
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<JornadaDto>> GetJornada(Guid id)
    {
        var j = await _context.Jornadas.FindAsync(id);

        if (j == null) return NotFound();

        return new JornadaDto
        {
            Id = j.Id,
            Nombre = j.Nombre,
            HorasDiarias = j.HorasDiarias,
            HorasSemanales = j.HorasSemanales
        };
    }

    [HttpPost]
    public async Task<ActionResult<JornadaDto>> CreateJornada(JornadaDto dto)
    {
        var j = new Jornada
        {
            Nombre = dto.Nombre,
            HorasDiarias = dto.HorasDiarias,
            HorasSemanales = dto.HorasSemanales
        };

        _context.Jornadas.Add(j);
        await _context.SaveChangesAsync(default);

        dto.Id = j.Id;
        return CreatedAtAction(nameof(GetJornada), new { id = j.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateJornada(Guid id, JornadaDto dto)
    {
        var j = await _context.Jornadas.FindAsync(id);
        if (j == null) return NotFound();

        j.Nombre = dto.Nombre;
        j.HorasDiarias = dto.HorasDiarias;
        j.HorasSemanales = dto.HorasSemanales;

        await _context.SaveChangesAsync(default);

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteJornada(Guid id)
    {
        var j = await _context.Jornadas.FindAsync(id);
        if (j == null) return NotFound();

        // Check if employees are linked
        var hasEmployees = await _context.Employees.AnyAsync(e => e.JornadaId == id);
        if (hasEmployees)
        {
            return BadRequest("No se puede eliminar la jornada porque tiene empleados vinculados.");
        }

        _context.Jornadas.Remove(j);
        await _context.SaveChangesAsync(default);

        return NoContent();
    }
}

public class JornadaDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public double HorasDiarias { get; set; }
    public double HorasSemanales { get; set; }
}
