using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;
using TalenHuman.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;
using FirebaseAdmin.Messaging;

namespace TalenHuman.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ComunicadosController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public ComunicadosController(IApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<IEnumerable<ComunicadoDto>>> GetComunicados()
    {
        return await _context.Comunicados
            .Include(c => c.CreatedByUser)
            .OrderByDescending(c => c.FechaEnvio)
            .Select(c => new ComunicadoDto
            {
                Id = c.Id,
                Titulo = c.Titulo,
                Contenido = c.Contenido,
                FechaEnvio = c.FechaEnvio,
                CreatedByName = c.CreatedByUser.FullName,
                ReadCount = c.ReadCount
            })
            .ToListAsync();
    }

    [HttpGet("my-communications")]
    public async Task<ActionResult<IEnumerable<ComunicadoDto>>> GetMyCommunications()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();
        
        var userId = Guid.Parse(userIdString);
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        // 🛡️ Multi-tenant filter is already applied globally in DbContext
        return await _context.Comunicados
            .OrderByDescending(c => c.FechaEnvio)
            .Take(10)
            .Select(c => new ComunicadoDto
            {
                Id = c.Id,
                Titulo = c.Titulo,
                Contenido = c.Contenido,
                FechaEnvio = c.FechaEnvio,
                CreatedByName = "Corporativo",
                ReadCount = c.ReadCount
            })
            .ToListAsync();
    }

    [HttpPost("broadcast")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> Broadcast([FromBody] BroadcastDto dto)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();
        
        var userId = Guid.Parse(userIdString);
        var admin = await _context.Users.FindAsync(userId);
        if (admin == null) return NotFound();

        var companyId = admin.CompanyId;

        // 1. Persist in the NEW independent table
        var comunicado = new Comunicado
        {
            Titulo = dto.Title,
            Contenido = dto.Body, // Rich Text / HTML
            CreatedByUserId = userId,
            CompanyId = companyId,
            FechaEnvio = ColombiaTime.Now
        };
        
        _context.Comunicados.Add(comunicado);
        await _context.SaveChangesAsync(default);

        // 2. Collect tokens ONLY for users belonging to THIS company
        var tokens = await _context.Users
            .Where(u => u.CompanyId == companyId && !string.IsNullOrEmpty(u.FirebaseToken))
            .Select(u => u.FirebaseToken)
            .ToListAsync();

        if (tokens.Any())
        {
            try {
                // 🧹 CLEAN PUSH: Strip HTML tags for the notification bar
                var plainBody = System.Text.RegularExpressions.Regex.Replace(dto.Body, "<.*?>", string.Empty);
                if (plainBody.Length > 150) plainBody = plainBody.Substring(0, 147) + "...";

                var message = new MulticastMessage()
                {
                    Tokens = tokens,
                    Notification = new Notification()
                    {
                        Title = "📢 " + dto.Title,
                        Body = plainBody
                    },
                    Data = new Dictionary<string, string>()
                    {
                        { "type", "broadcast" },
                        { "tenant", companyId.ToString() },
                        { "comunicadoId", comunicado.Id.ToString() }
                    }
                };

                await FirebaseMessaging.DefaultInstance.SendMulticastAsync(message);
            } catch (Exception ex) {
                Console.WriteLine($"FCM Broadcast Error: {ex.Message}");
            }
        }

        await _auditService.LogAsync("BROADCAST", "Comunicado", comunicado.Id.ToString(), $"Comunicado difundido: {dto.Title}");

        return Ok(new { status = "success", count = tokens.Count, id = comunicado.Id });
    }
}

public class ComunicadoDto
{
    public Guid Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Contenido { get; set; } = string.Empty;
    public DateTime FechaEnvio { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public int ReadCount { get; set; }
}

public class BroadcastDto
{
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
}
