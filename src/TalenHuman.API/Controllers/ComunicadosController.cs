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
    private readonly ITenantProvider _tenantProvider;

    public ComunicadosController(
        IApplicationDbContext context, 
        IAuditService auditService, 
        ISystemSettingsService settings, 
        ILogger<ComunicadosController> logger,
        NotificationService notificationService,
        ITenantProvider tenantProvider)
    {
        _context = context;
        _auditService = auditService;
        _settings = settings;
        _logger = logger;
        _notificationService = notificationService;
        _tenantProvider = tenantProvider;
    }

    [AllowAnonymous]
    [HttpGet("ping")]
    public IActionResult Ping()
    {
        _logger.LogInformation("FCM Diagnostic: Ping received at {Time}", DateTime.UtcNow);
        return Ok(new { message = "Pong", version = "V12.20", timestamp = DateTime.UtcNow });
    }

    [HttpGet]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<IEnumerable<ComunicadoDto>>> GetComunicados()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return Unauthorized();

        var companyId = _tenantProvider.GetTenantId();
        _logger.LogInformation("[TENANT-CHECK] GET Comunicados | User: {User} | CompanyId: {CompanyId}", user.NormalizedUserName, companyId);
        
        var query = _context.Comunicados
            .IgnoreQueryFilters()
            .Where(c => c.CompanyId == companyId)
            .AsQueryable();

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
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();
        
        var userId = Guid.Parse(userIdString);
        var admin = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId);
        if (admin == null) return NotFound();

        var companyId = _tenantProvider.GetTenantId();
        _logger.LogInformation("[TENANT-CHECK] POST Broadcast | User: {User} | CompanyId: {CompanyId}", admin.NormalizedUserName, companyId);

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

        // 2. Fetch only users with Firebase tokens for this company (Optimization V12.92)
        var targetUsers = await _context.Users
            .Where(u => u.CompanyId == companyId && u.IsActive && !string.IsNullOrEmpty(u.FirebaseToken))
            .Select(u => new { u.Id, u.FirebaseToken })
            .ToListAsync();

        var userIds = targetUsers.Select(u => u.Id).ToList();
        var tokens = targetUsers
            .Where(u => !string.IsNullOrEmpty(u.FirebaseToken))
            .Select(u => u.FirebaseToken!)
            .Distinct()
            .ToList();

        // 3. Send via optimized Centralized NotificationService (V12.20)
        await _notificationService.SendBroadcastAsync(userIds, tokens, new NotificationRequest
        {
            Subject = "📢 " + dto.Title,
            Message = dto.Body,
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
            message = tokens.Any() ? "Comunicado enviado e historial actualizado" : "Comunicado guardado, pero no hay dispositivos registrados",
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
        var admin = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == Guid.Parse(userIdString));
        if (admin == null) return Unauthorized();

        var comunicado = await _context.Comunicados.FindAsync(id);
        if (comunicado == null) return NotFound();

        if (comunicado.CompanyId != admin.CompanyId) return Forbid();

        _context.Comunicados.Remove(comunicado);
        await _context.SaveChangesAsync(default);
        
        await _auditService.LogAsync("DELETE", "Comunicado", id.ToString(), $"Comunicado eliminado: {comunicado.Titulo}");
        return Ok();
    }

    [HttpPost("test-fcm")]
    public async Task<IActionResult> TestFcm()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return NotFound("Usuario no encontrado");

        if (string.IsNullOrEmpty(user.FirebaseToken))
        {
            return BadRequest(new { 
                error = "Dispositivo no registrado", 
                message = "Tu usuario no tiene un token de Firebase asignado. Por favor, recarga la aplicación y acepta los permisos de notificación." 
            });
        }

        try
        {
            var projectId = await _settings.GetSettingAsync("FIREBASE_PROJECT_ID") ?? "talenhuman (fallback)";
            var senderId = await _settings.GetSettingAsync("FIREBASE_MESSAGING_SENDER_ID") ?? "---";

            var responseId = await _notificationService.SendNotificationAsync(new NotificationRequest
            {
                To = user.FirebaseToken,
                UserId = user.Id,
                Subject = "🚀 Prueba Real de Nube",
                Message = $"Hola {user.FullName.Split(' ')[0]}, si recibes esto, la conexión entre TalenHuman y Google Firebase está ACTIVA. (V12.60)",
                Type = NotificationType.Push,
                Category = "diagnostic",
                Metadata = new Dictionary<string, string> { { "type", "test" } }
            });

            return Ok(new { 
                message = "Orden de Push enviada correctamente a tu dispositivo",
                responseId = responseId,
                projectId = projectId,
                senderId = senderId,
                tokenPreview = user.FirebaseToken.Length > 15 ? user.FirebaseToken.Substring(0, 15) + "..." : user.FirebaseToken
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { 
                error = "Error en el servidor de Google/Firebase", 
                message = ex.Message 
            });
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
