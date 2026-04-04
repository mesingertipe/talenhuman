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
[Route("api/comunicados")]
public class ComunicadosController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly ISystemSettingsService _settings;

    public ComunicadosController(IApplicationDbContext context, IAuditService auditService, ISystemSettingsService settings)
    {
        _context = context;
        _auditService = auditService;
        _settings = settings;
    }

    [HttpPost("token")]
    public async Task<IActionResult> UpdateFirebaseToken([FromBody] TokenUpdateDto dto)
    {
        var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        user.FirebaseToken = dto.Token;
        await _context.SaveChangesAsync(default);

        await _auditService.LogAsync("FCM_SYNC", "User", userId.ToString(), $"Token sync (V65.1.12) para {user.UserName}");

        return Ok(new { status = "success" });
    }

    public class TokenUpdateDto { public string Token { get; set; } = string.Empty; }

    private async Task<string> EnsureFirebaseInitializedAsync()
    {
        if (FirebaseAdmin.FirebaseApp.DefaultInstance != null) return "OK";

        var projectId = await _settings.GetSettingAsync("FIREBASE_PROJECT_ID");
        if (string.IsNullOrEmpty(projectId)) 
            throw new Exception("FIREBASE_PROJECT_ID no configurado en ajustes del sistema.");

        try {
            FirebaseAdmin.FirebaseApp.Create(new FirebaseAdmin.AppOptions() {
                Credential = Google.Apis.Auth.OAuth2.GoogleCredential.GetApplicationDefault(),
                ProjectId = projectId
            });
            return "INITIALIZED";
        } catch (Exception ex) {
            throw new Exception($"Error inicializando Firebase: {ex.Message}");
        }
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
                ImagenUrl = c.ImagenUrl,
                FechaEnvio = c.FechaEnvio,
                FechaInicio = c.FechaInicio,
                FechaFin = c.FechaFin,
                IsActive = c.IsActive,
                CreatedByName = c.CreatedByUser.FullName,
                ReadCount = c.ReadCount
            })
            .ToListAsync();
    }

    [HttpGet("active")]
    public async Task<ActionResult<ComunicadoDto>> GetActiveCommunication()
    {
        var now = ColombiaTime.Now;
        
        // 🔒 SMART FILTER: Must be active and within date range (if range exists)
        var active = await _context.Comunicados
            .Where(c => c.IsActive && 
                        (c.FechaInicio == null || c.FechaInicio <= now) && 
                        (c.FechaFin == null || c.FechaFin >= now))
            .OrderByDescending(c => c.FechaEnvio)
            .FirstOrDefaultAsync();

        if (active == null) return NotFound();

        return Ok(new ComunicadoDto
        {
            Id = active.Id,
            Titulo = active.Titulo,
            Contenido = active.Contenido,
            ImagenUrl = active.ImagenUrl,
            FechaEnvio = active.FechaEnvio
        });
    }

    [HttpGet("my-communications")]
    public async Task<ActionResult<IEnumerable<ComunicadoDto>>> GetMyCommunications()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();

        // 🛡️ Only show communications that are currently ACTIVE
        var now = ColombiaTime.Now;
        return await _context.Comunicados
            .Where(c => c.IsActive && (c.FechaFin == null || c.FechaFin >= now))
            .OrderByDescending(c => c.FechaEnvio)
            .Take(15)
            .Select(c => new ComunicadoDto
            {
                Id = c.Id,
                Titulo = c.Titulo,
                Contenido = c.Contenido,
                ImagenUrl = c.ImagenUrl,
                FechaEnvio = c.FechaEnvio,
                CreatedByName = "Corporativo"
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

        // 1. Create with New V63.7 Schema
        var comunicado = new Comunicado
        {
            Titulo = dto.Title,
            Contenido = dto.Body,
            ImagenUrl = dto.ImageUrl,
            FechaInicio = dto.FechaInicio,
            FechaFin = dto.FechaFin,
            IsActive = true,
            CreatedByUserId = userId,
            CompanyId = companyId,
            FechaEnvio = ColombiaTime.Now
        };
        
        _context.Comunicados.Add(comunicado);
        await _context.SaveChangesAsync(default);

        // 2. ONE-TIME PUSH: Only trigger on creation
        var tokensQuery = _context.Users.AsQueryable();
        
        // 🛡️ If admin has a company, only send to that company. 
        // 🛡️ If admin is SuperAdmin (null company), send to all registered tokens.
        if (companyId != null) {
            tokensQuery = tokensQuery.Where(u => u.CompanyId == companyId);
        }

        var tokens = await tokensQuery
            .Where(u => !string.IsNullOrEmpty(u.FirebaseToken))
            .Select(u => u.FirebaseToken)
            .ToListAsync();

        if (tokens.Any())
        {
            try {
                var plainBody = System.Text.RegularExpressions.Regex.Replace(dto.Body, "<.*?>", string.Empty);
                if (plainBody.Length > 150) plainBody = plainBody.Substring(0, 147) + "...";

                var absoluteImageUrl = string.IsNullOrEmpty(dto.ImageUrl) ? null : 
                                      (dto.ImageUrl.StartsWith("http") ? dto.ImageUrl : $"{Request.Scheme}://{Request.Host}{dto.ImageUrl}");

                var message = new MulticastMessage()
                {
                    Tokens = tokens,
                    Notification = new Notification()
                    {
                        Title = "📢 " + dto.Title,
                        Body = plainBody,
                        ImageUrl = absoluteImageUrl // 📸 Push Absolute Image injection
                    },
                    Data = new Dictionary<string, string>()
                    {
                        { "type", "broadcast" },
                        { "comunicadoId", comunicado.Id.ToString() }
                    }
                };

                await FirebaseMessaging.DefaultInstance.SendMulticastAsync(message);
            } catch (Exception ex) {
                Console.WriteLine($"FCM Broadcast Error: {ex.Message}");
            }
        }

        await _auditService.LogAsync("BROADCAST", "Comunicado", comunicado.Id.ToString(), $"Comunicado difundido: {dto.Title}");

        return Ok(new { status = "success", id = comunicado.Id });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] BroadcastDto dto)
    {
        var comunicado = await _context.Comunicados.FindAsync(id);
        if (comunicado == null) return NotFound();

        comunicado.Titulo = dto.Title;
        comunicado.Contenido = dto.Body;
        comunicado.ImagenUrl = dto.ImageUrl;
        comunicado.FechaInicio = dto.FechaInicio;
        comunicado.FechaFin = dto.FechaFin;
        comunicado.IsActive = dto.IsActive;

        await _context.SaveChangesAsync(default);
        await _auditService.LogAsync("UPDATE", "Comunicado", id.ToString(), $"Comunicado editado: {dto.Title}");

        return Ok();
    }

    [HttpPost("test-fcm")]
    public async Task<IActionResult> TestFcm()
    {
        var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();

        try {
            await EnsureFirebaseInitializedAsync();
            
            var userId = Guid.Parse(userIdString);
            var user = await _context.Users.FindAsync(userId);
            if (user == null || string.IsNullOrEmpty(user.FirebaseToken)) 
                return BadRequest(new { status = "error", message = "No tienes token FCM registrado. Intenta refrescar la App." });

            var message = new Message()
            {
                Token = user.FirebaseToken,
                Notification = new Notification()
                {
                    Title = "⚡️ Prueba de Nube Elite",
                    Body = $"Enviado el {DateTime.Now:HH:mm:ss} desde V65.1.12"
                },
                Data = new Dictionary<string, string>() {
                    { "type", "test" },
                    { "version", "V65.1.12" }
                }
            };

            var response = await FirebaseMessaging.DefaultInstance.SendAsync(message);
            return Ok(new { status = "success", message = "Orden enviada a la nube", response });
        } catch (Exception ex) {
            return BadRequest(new { status = "error", message = ex.Message });
        }
    }
}

public class ComunicadoDto
{
    public Guid Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Contenido { get; set; } = string.Empty;
    public string? ImagenUrl { get; set; }
    public DateTime FechaEnvio { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public bool IsActive { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public int ReadCount { get; set; }
}

public class BroadcastDto
{
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public bool IsActive { get; set; } = true;
}
