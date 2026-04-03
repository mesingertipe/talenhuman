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
public class NovedadesController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public NovedadesController(IApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<NovedadDto>>> GetNovedades(
        [FromQuery] Guid? storeId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] NovedadStatus? status = null)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        var userRoles = User.FindAll(ClaimTypes.Role).Select(r => r.Value).ToList();
        
        var query = _context.Novedades
            .Include(n => n.Empleado)
            .Include(n => n.Store)
            .Include(n => n.Brand)
            .Include(n => n.NovedadTipo)
            .Include(n => n.Adjuntos)
            .AsQueryable();

        // Optional Filters
        if (storeId.HasValue)
        {
            query = query.Where(n => (n.Empleado != null && n.Empleado.StoreId == storeId.Value) || (n.StoreId == storeId.Value));
        }

        if (startDate.HasValue)
        {
            var start = startDate.Value.ToUniversalTime().Date;
            query = query.Where(n => n.FechaFin >= start);
        }

        if (endDate.HasValue)
        {
            var end = endDate.Value.ToUniversalTime().Date.AddDays(1).AddTicks(-1);
            query = query.Where(n => n.FechaInicio <= end);
        }

        if (status.HasValue)
        {
            query = query.Where(n => n.Status == status.Value);
        }

        // RBAC: Filter by RoleAprobador (only for Pending) and Managed Stores
        if (!userRoles.Contains("SuperAdmin") && !userRoles.Contains("Admin"))
        {
            // IMPORTANT: If news is PENDING, only the assigned approver role can see it.
            // If it is already APPROVED/RECHAZADO, it is "public" for the store management.
            query = query.Where(n => n.Status != NovedadStatus.Pendiente || userRoles.Contains(n.NovedadTipo.RolAprobador));

            // If it's a Distrital/Gerente, further filter by their managed stores
            if (userRoles.Contains("Distrital") || userRoles.Contains("Gerente"))
            {
                var managedStores = await _context.SupervisorStores
                    .Where(s => s.UserId == userId)
                    .Select(s => s.StoreId)
                    .ToListAsync();
                
                query = query.Where(n => 
                    (n.Empleado != null && managedStores.Contains(n.Empleado.StoreId)) ||
                    (n.StoreId != null && managedStores.Contains(n.StoreId.Value)) ||
                    (n.BrandId != null) // Brands are usually global or handled by Admin/RH
                );
            }
        }

        return await query
            .Select(n => new NovedadDto
            {
                Id = n.Id,
                IdSolicitud = n.IdSolicitud,
                EmpleadoId = n.EmpleadoId,
                EmpleadoNombre = n.Empleado != null ? $"{n.Empleado.FirstName} {n.Empleado.LastName}" : null,
                EmpleadoCedula = n.Empleado != null ? n.Empleado.IdentificationNumber : null,
                StoreId = n.StoreId,
                StoreNombre = n.Store != null ? n.Store.Name : null,
                BrandId = n.BrandId,
                BrandNombre = n.Brand != null ? n.Brand.Name : null,
                NovedadTipoId = n.NovedadTipoId,
                NovedadTipoNombre = n.NovedadTipo.Nombre,
                NovedadCategoria = n.NovedadTipo.Categoria.ToString(),
                FechaInicio = n.FechaInicio,
                FechaFin = n.FechaFin,
                Status = n.Status,
                AdjuntoUrl = n.AdjuntoUrl,
                HasAttachments = n.Adjuntos.Any(),
                AttachmentsCount = n.Adjuntos.Count(),
                DatosDinamicos = n.DatosDinamicos,
                Observaciones = n.Observaciones,
                CreatedBy = n.Logs.Where(l => l.Accion == "Creó").Select(l => l.Usuario.FullName).FirstOrDefault() ?? "Sistema"
            })
            .OrderByDescending(n => n.FechaInicio)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<NovedadDetailDto>> GetNovedad(Guid id)
    {
        var n = await _context.Novedades
            .Include(x => x.Empleado)
            .Include(x => x.Store)
            .Include(x => x.Brand)
            .Include(x => x.NovedadTipo)
            .Include(x => x.Adjuntos)
            .Include(x => x.Logs)
                .ThenInclude(l => l.Usuario)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (n == null) return NotFound();

        return new NovedadDetailDto
        {
            Id = n.Id,
            IdSolicitud = n.IdSolicitud,
            EmpleadoNombre = n.Empleado != null ? $"{n.Empleado.FirstName} {n.Empleado.LastName}" : null,
            EmpleadoCedula = n.Empleado != null ? n.Empleado.IdentificationNumber : null,
            StoreNombre = n.Store?.Name,
            BrandNombre = n.Brand?.Name,
            NovedadTipoNombre = n.NovedadTipo.Nombre,
            NovedadCategoria = n.NovedadTipo.Categoria.ToString(),
            FechaInicio = n.FechaInicio,
            FechaFin = n.FechaFin,
            Status = n.Status,
            AdjuntoUrl = n.AdjuntoUrl,
            DatosDinamicos = n.DatosDinamicos,
            Observaciones = n.Observaciones,
            Adjuntos = n.Adjuntos.Select(a => new AttachmentDto
            {
                Id = a.Id,
                Url = a.Url,
                FileName = a.FileName
            }).ToList(),
            Logs = n.Logs.Select(l => new NovedadLogDto
            {
                Usuario = l.Usuario.FullName ?? "Sistema",
                Accion = l.Accion,
                Comentario = l.Comentario,
                FechaHoraColombia = l.FechaHoraColombia
            }).OrderByDescending(l => l.FechaHoraColombia).ToList()
        };
    }

    [HttpPost]
    public async Task<ActionResult<NovedadDto>> CreateNovedad(CreateNovedadDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        
        var tipo = await _context.NovedadTipos.FindAsync(dto.NovedadTipoId);
        if (tipo == null) return BadRequest("Tipo de novedad no válido.");

        // Elite V12 Security Validation: Check for required attachments
        if (tipo.RequiereAdjunto && (dto.Adjuntos == null || !dto.Adjuntos.Any()))
        {
            return BadRequest("Este tipo de novedad requiere al menos un archivo adjunto.");
        }

        var n = new Novedad
        {
            EmpleadoId = dto.EmpleadoId,
            StoreId = dto.StoreId,
            BrandId = dto.BrandId,
            NovedadTipoId = dto.NovedadTipoId,
            FechaInicio = dto.FechaInicio,
            FechaFin = dto.FechaFin,
            Status = NovedadStatus.Pendiente,
            DatosDinamicos = dto.DatosDinamicos,
            Observaciones = dto.Observaciones
        };

        if (dto.Adjuntos != null)
        {
            foreach (var adj in dto.Adjuntos)
            {
                n.Adjuntos.Add(new NovedadAdjunto
                {
                    Url = adj.Url,
                    FileName = adj.FileName
                });
            }
        }

        n.Logs.Add(new NovedadLog
        {
            UsuarioId = userId,
            Accion = "Creó",
            Comentario = "Registro inicial de la novedad.",
            FechaHoraColombia = ColombiaTime.Now
        });

        _context.Novedades.Add(n);
        await _context.SaveChangesAsync(default);

        await _auditService.LogAsync("CREATE", "Novedad", n.Id.ToString(), $"Novedad creada del tipo: {tipo.Nombre}");

        return CreatedAtAction(nameof(GetNovedad), new { id = n.Id }, new NovedadDto { Id = n.Id });
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, UpdateNovedadStatusDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        var userRoles = User.FindAll(ClaimTypes.Role).Select(r => r.Value).ToList();

        var n = await _context.Novedades
            .Include(x => x.NovedadTipo)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (n == null) return NotFound();

        // RBAC Check for approval
        if (!userRoles.Contains("SuperAdmin") && !userRoles.Contains("Admin"))
        {
            if (!userRoles.Contains(n.NovedadTipo.RolAprobador))
            {
                return Forbid("No tiene el rol requerido para aprobar este tipo de novedad.");
            }
        }

        if (string.IsNullOrEmpty(dto.Comentario))
        {
            return BadRequest("El comentario es obligatorio para procesar la novedad.");
        }

        n.Status = dto.Status;
        
        var log = new NovedadLog
        {
            NovedadId = id,
            UsuarioId = userId,
            Accion = dto.Status == NovedadStatus.Aprobado ? "Aprobó" : "Rechazó",
            Comentario = dto.Comentario,
            FechaHoraColombia = ColombiaTime.Now
        };

        _context.NovedadLogs.Add(log);
        await _context.SaveChangesAsync(default);

        string actionType = dto.Status == NovedadStatus.Aprobado ? "APPROVE" : "REJECT";
        await _auditService.LogAsync(actionType, "Novedad", n.Id.ToString(), $"Estado de novedad cambiado a {dto.Status}");

        return NoContent();
    }

    [HttpGet("my-news")]
    public async Task<ActionResult<IEnumerable<NovedadDto>>> GetMyNews()
    {
        var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var employee = await _context.Employees.FirstOrDefaultAsync(e => e.UserId == userId);
        
        // If the user is not linked to an employee record, return empty list (e.g. global admins)
        if (employee == null) return Ok(new List<NovedadDto>());

        // Show Approved news for their store OR news they created personally
        var query = _context.Novedades
            .Include(n => n.NovedadTipo)
            .Include(n => n.Empleado)
            .Where(n => 
                (n.EmpleadoId == employee.Id) || 
                (n.StoreId == employee.StoreId && n.Status == NovedadStatus.Aprobado)
            )
            .OrderByDescending(n => n.FechaInicio)
            .Take(5);

        return await query
            .Select(n => new NovedadDto
            {
                Id = n.Id,
                EmpleadoNombre = n.Empleado != null ? $"{n.Empleado.FirstName} {n.Empleado.LastName}" : null,
                NovedadTipoNombre = n.NovedadTipo.Nombre,
                NovedadCategoria = n.NovedadTipo.Categoria.ToString(),
                FechaInicio = n.FechaInicio,
                FechaFin = n.FechaFin,
                Status = n.Status,
                Observaciones = n.Observaciones
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

        // 🛡️ ELITE MULTI-TENANT ISOLATION: Find a suitable news type for this company
        var tipo = await _context.NovedadTipos
            .Where(t => t.CompanyId == companyId)
            .OrderBy(t => t.Nombre.Contains("Comunicado") ? 0 : 1)
            .FirstOrDefaultAsync();

        if (tipo == null) return BadRequest("La empresa no tiene configurada ninguna estructura de comunicaciones.");

        // 1. Create a "Global News" record tied strictly to THIS company
        // 🧪 ELITE MEDIA: We store the full HTML in Observaciones
        var generalNews = new Novedad
        {
            NovedadTipoId = tipo.Id,
            CompanyId = companyId,
            FechaInicio = DateTime.UtcNow,
            FechaFin = DateTime.UtcNow.AddDays(7),
            Status = NovedadStatus.Aprobado,
            Observaciones = dto.Body // Full Rich Text / HTML
        };
        _context.Novedades.Add(generalNews);
        await _context.SaveChangesAsync(default);
        
        // 2. Collect tokens ONLY for users belonging to THIS company
        var tokens = await _context.Users
            .Where(u => u.CompanyId == companyId && !string.IsNullOrEmpty(u.FirebaseToken))
            .Select(u => u.FirebaseToken)
            .ToListAsync();

        if (tokens.Any())
        {
            try {
                // 🧹 CLEAN PUSH: Strip HTML tags for the notification bar to avoid showing <b> or <img> tags
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
                        { "newsId", generalNews.Id.ToString() }
                    }
                };

                await FirebaseMessaging.DefaultInstance.SendMulticastAsync(message);
            } catch (Exception ex) {
                Console.WriteLine($"FCM Broadcast Error: {ex.Message}");
            }
        }

        return Ok(new { status = "success", count = tokens.Count });
    }
}

public class NovedadDto
{
    public Guid Id { get; set; }
    public int IdSolicitud { get; set; }
    public Guid? EmpleadoId { get; set; }
    public string? EmpleadoNombre { get; set; }
    public string? EmpleadoCedula { get; set; }
    public Guid? StoreId { get; set; }
    public string? StoreNombre { get; set; }
    public Guid? BrandId { get; set; }
    public string? BrandNombre { get; set; }
    public Guid NovedadTipoId { get; set; }
    public string NovedadTipoNombre { get; set; } = string.Empty;
    public string NovedadCategoria { get; set; } = string.Empty;
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public NovedadStatus Status { get; set; }
    public string? AdjuntoUrl { get; set; }
    public bool HasAttachments { get; set; }
    public int AttachmentsCount { get; set; }
    public string? DatosDinamicos { get; set; }
    public string? Observaciones { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}

public class AttachmentDto
{
    public Guid Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
}

public class NovedadDetailDto : NovedadDto
{
    public List<AttachmentDto> Adjuntos { get; set; } = new List<AttachmentDto>();
    public List<NovedadLogDto> Logs { get; set; } = new List<NovedadLogDto>();
}

public class NovedadLogDto
{
    public string Usuario { get; set; } = string.Empty;
    public string Accion { get; set; } = string.Empty;
    public string Comentario { get; set; } = string.Empty;
    public DateTime FechaHoraColombia { get; set; }
}

public class CreateNovedadDto
{
    public Guid? EmpleadoId { get; set; }
    public Guid? StoreId { get; set; }
    public Guid? BrandId { get; set; }
    public Guid NovedadTipoId { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public List<AttachmentDto>? Adjuntos { get; set; }
    public string? DatosDinamicos { get; set; }
    public string? Observaciones { get; set; }
}

public class UpdateNovedadStatusDto
{
    public NovedadStatus Status { get; set; }
    public string Comentario { get; set; } = string.Empty;
}

public class BroadcastDto
{
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
}
