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

using TalenHuman.Application.Services;

namespace TalenHuman.API.Controllers;

[Authorize]
[ApiController]
[Route("api/comunicados")]
public class ComunicadosController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly ISystemSettingsService _settings;
    private readonly ILogger<ComunicadosController> _logger;
    private readonly NotificationService _notificationService;

    public ComunicadosController(
        IApplicationDbContext context, 
        IAuditService auditService, 
        ISystemSettingsService settings, 
        ILogger<ComunicadosController> logger,
        NotificationService notificationService)
    {
        _context = context;
        _auditService = auditService;
        _settings = settings;
        _logger = logger;
        _notificationService = notificationService;
    }

    [AllowAnonymous]
    [HttpGet("ping")]
    public IActionResult Ping()
    {
        _logger.LogInformation("FCM Diagnostic: Ping received at {Time}", DateTime.UtcNow);
        return Ok(new { message = "Pong", version = "V65.1.25-ELITE", timestamp = DateTime.UtcNow });
    }

    [HttpPost("sync-token")]
    public async Task<IActionResult> UpdateFirebaseToken([FromBody] TokenUpdateDto dto)
    {
        _logger.LogInformation("FCM Sync: Request received (V65.1.25)");

        var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString)) 
        {
            _logger.LogWarning("FCM Sync: Unauthorized (No NameIdentifier)");
            return Unauthorized();
        }

        var userId = Guid.Parse(userIdString);
        var user = await _context.Users.FindAsync(userId);
        if (user == null) 
        {
            _logger.LogWarning("FCM Sync: User {UserId} not found", userId);
            return NotFound();
        }

        user.FirebaseToken = dto.Token;
        await _context.SaveChangesAsync(default);

        _logger.LogInformation("FCM Sync: Token updated for user {User}", user.UserName);
        await _auditService.LogAsync("FCM_SYNC", "User", userId.ToString(), $"Token sync V65.1.25 para {user.UserName}");

        return Ok(new { status = "success", version = "V65.1.25" });
    }

    public class TokenUpdateDto { public string Token { get; set; } = string.Empty; }

    private async Task<string> EnsureFirebaseInitializedAsync()
    {
        if (FirebaseAdmin.FirebaseApp.DefaultInstance != null) return "OK";

        var projectId = await _settings.GetSettingAsync("FIREBASE_PROJECT_ID");
        var json = await _settings.GetSettingAsync("FIREBASE_S_ACCOUNT") 
                   ?? Environment.GetEnvironmentVariable("FIREBASE_S_ACCOUNT");
        
        if (string.IsNullOrEmpty(projectId)) 
            throw new Exception("FIREBASE_PROJECT_ID no configurado en ajustes del sistema.");

        try {
            FirebaseAdmin.AppOptions options;
            if (!string.IsNullOrEmpty(json))
            {
                options = new FirebaseAdmin.AppOptions() {
                    Credential = Google.Apis.Auth.OAuth2.GoogleCredential.FromJson(json),
                    ProjectId = projectId
                };
            }
            else
            {
                options = new FirebaseAdmin.AppOptions() {
                    Credential = Google.Apis.Auth.OAuth2.GoogleCredential.GetApplicationDefault(),
                    ProjectId = projectId
                };
            }

            FirebaseAdmin.FirebaseApp.Create(options);
            return "INITIALIZED";
        } catch (Exception ex) {
            throw new Exception($"Error inicializando Firebase SDK: {ex.Message}");
        }
    }

    [HttpGet]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<IEnumerable<ComunicadoDto>>> GetComunicados()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        var query = _context.Comunicados.AsQueryable();
        query = query.Where(c => c.CompanyId == user.CompanyId);

        return await query
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
        await EnsureFirebaseInitializedAsync();
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();
        
        var userId = Guid.Parse(userIdString);
        var admin = await _context.Users.FindAsync(userId);
        if (admin == null) return NotFound();

        var companyId = admin.CompanyId;
        _logger.LogInformation("Elite Broadcast: Starting for CompanyId {CompanyId}", companyId);

        // 1. Create Comunicado record
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

        // 2. Fetch all users and tokens for this company
        var targetUsers = await _context.Users
            .Where(u => u.CompanyId == companyId && u.IsActive)
            .Select(u => new { u.Id, u.FirebaseToken })
            .ToListAsync();

        var userIds = targetUsers.Select(u => u.Id).ToList();
        var tokens = targetUsers
            .Where(u => !string.IsNullOrEmpty(u.FirebaseToken))
            .Select(u => u.FirebaseToken!)
            .Distinct()
            .ToList();

        // 3. Send via optimized NotificationService
        var plainBody = System.Text.RegularExpressions.Regex.Replace(dto.Body ?? "", "<.*?>", string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(plainBody)) plainBody = "Nuevo comunicado disponible";
        if (plainBody.Length > 160) plainBody = plainBody.Substring(0, 157) + "...";

        await _notificationService.SendBroadcastAsync(userIds, tokens, new NotificationRequest
        {
            Subject = "📢 " + dto.Title,
            Message = plainBody,
            Type = NotificationType.Push,
            Category = "broadcast",
            Metadata = new Dictionary<string, string>
            {
                { "comunicadoId", comunicado.Id.ToString() },
                { "type", "broadcast" }
            }
        });

        await _auditService.LogAsync("BROADCAST", "Comunicado", comunicado.Id.ToString(), $"Comunicado difundido: {dto.Title}");

        return Ok(new { 
            status = tokens.Any() ? "success" : "warning", 
            message = tokens.Any() ? "Comunicado enviado a la nube e historial actualizado" : "Comunicado guardado e historial actualizado, pero no hay dispositivos registrados",
            id = comunicado.Id
        });
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

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> DeleteComunicado(Guid id)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var admin = await _context.Users.FindAsync(Guid.Parse(userIdString));
        if (admin == null) return Unauthorized();

        var comunicado = await _context.Comunicados.FindAsync(id);
        if (comunicado == null) return NotFound();

        // 🛡️ SECURITY: Even SuperAdmin can only delete if CompanyId matches (Current Tenant)
        if (comunicado.CompanyId != admin.CompanyId)
        {
            // Even if they are SuperAdmin, they must be in the correct tenant context
            return Forbid();
        }

        _context.Comunicados.Remove(comunicado);
        await _context.SaveChangesAsync(default);
        
        await _auditService.LogAsync("DELETE", "Comunicado", id.ToString(), $"Comunicado eliminado: {comunicado.Titulo}");
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
                    Body = $"Enviado el {DateTime.Now:HH:mm:ss} desde V65.1.16"
                },
                Data = new Dictionary<string, string>() {
                    { "type", "test" },
                    { "version", "V65.1.16" }
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
