using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Application.Services;
using TalenHuman.Domain.Entities;
using TalenHuman.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;

namespace TalenHuman.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NovedadesController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly NotificationService _notificationService;

    public NovedadesController(IApplicationDbContext context, IAuditService auditService, NotificationService notificationService)
    {
        _context = context;
        _auditService = auditService;
        _notificationService = notificationService;
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
            if (!userRoles.Contains("Gerente") && !userRoles.Contains("Distrital"))
            {
                query = query.Where(n => n.Status != NovedadStatus.PendienteGerente);
            }

            query = query.Where(n => n.Status != NovedadStatus.Pendiente || userRoles.Contains(n.NovedadTipo.RolAprobador));

            if (userRoles.Contains("Distrital") || userRoles.Contains("Gerente"))
            {
                var managedStores = await _context.SupervisorStores
                    .Where(s => s.UserId == userId)
                    .Select(s => s.StoreId)
                    .ToListAsync();
                
                query = query.Where(n => 
                    (n.Empleado != null && managedStores.Contains(n.Empleado.StoreId)) ||
                    (n.StoreId != null && managedStores.Contains(n.StoreId.Value)) ||
                    (n.BrandId != null) 
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
        var userRoles = User.FindAll(ClaimTypes.Role).Select(r => r.Value).ToList();
        
        var tipo = await _context.NovedadTipos.FindAsync(dto.NovedadTipoId);
        if (tipo == null) return BadRequest("Tipo de novedad no válido.");

        if (tipo.RequiereAdjunto && (dto.Adjuntos == null || !dto.Adjuntos.Any()))
        {
            return BadRequest("Este tipo de novedad requiere al menos un archivo adjunto.");
        }

        Guid? targetEmpleadoId = dto.EmpleadoId;
        Guid? targetStoreId = dto.StoreId;
        Guid? targetBrandId = dto.BrandId;
        NovedadStatus initialStatus = NovedadStatus.Pendiente;

        if (userRoles.Contains("Empleado"))
        {
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.UserId == userId);
            if (employee == null) return BadRequest("No se encontró información de empleado para su usuario.");

            targetEmpleadoId = employee.Id;
            targetStoreId = employee.StoreId;
            targetBrandId = null;

            if (!tipo.PermiteCreacionEmpleado)
            {
                return BadRequest("Este tipo de novedad no está habilitado para ser creado por empleados.");
            }

            initialStatus = NovedadStatus.PendienteGerente;
        }

        var n = new Novedad
        {
            EmpleadoId = targetEmpleadoId,
            StoreId = targetStoreId,
            BrandId = targetBrandId,
            NovedadTipoId = dto.NovedadTipoId,
            FechaInicio = dto.FechaInicio,
            FechaFin = dto.FechaFin,
            Status = initialStatus,
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
            Comentario = userRoles.Contains("Empleado") ? "Solicitud registrada por el empleado." : "Registro inicial de la novedad.",
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
            .Include(x => x.Empleado)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (n == null) return NotFound();

        if (string.IsNullOrEmpty(dto.Comentario))
        {
            return BadRequest("El comentario es obligatorio para procesar la novedad.");
        }

        string logAction = "";

        if (n.Status == NovedadStatus.PendienteGerente)
        {
            bool isAuthorized = userRoles.Contains("SuperAdmin") || userRoles.Contains("Admin") || userRoles.Contains("RH");
            if (!isAuthorized && (userRoles.Contains("Gerente") || userRoles.Contains("Distrital")))
            {
                var storeIdToVerify = n.StoreId ?? (n.Empleado != null ? n.Empleado.StoreId : Guid.Empty);
                if (storeIdToVerify != Guid.Empty)
                {
                    isAuthorized = await _context.SupervisorStores
                        .AnyAsync(s => s.UserId == userId && s.StoreId == storeIdToVerify);
                }
            }

            if (!isAuthorized)
            {
                return Forbid("No tiene permisos para aprobar la novedad de este empleado.");
            }

            if (dto.Status == NovedadStatus.Aprobado)
            {
                n.Status = NovedadStatus.Pendiente;
                logAction = "Aprobó (Gerente)";
            }
            else if (dto.Status == NovedadStatus.Rechazado)
            {
                n.Status = NovedadStatus.Rechazado;
                logAction = "Rechazó (Gerente)";
            }
            else
            {
                return BadRequest("Estado de transición no válido para aprobación de gerente.");
            }
        }
        else
        {
            if (!userRoles.Contains("SuperAdmin") && !userRoles.Contains("Admin"))
            {
                if (!userRoles.Contains(n.NovedadTipo.RolAprobador))
                {
                    return Forbid("No tiene el rol requerido para aprobar este tipo de novedad.");
                }
            }

            n.Status = dto.Status;
            logAction = dto.Status == NovedadStatus.Aprobado ? "Aprobó" : "Rechazó";
        }

        var log = new NovedadLog
        {
            NovedadId = id,
            UsuarioId = userId,
            Accion = logAction,
            Comentario = dto.Comentario,
            FechaHoraColombia = ColombiaTime.Now
        };

        _context.NovedadLogs.Add(log);
        await _context.SaveChangesAsync(default);

        string actionType = dto.Status == NovedadStatus.Aprobado ? "APPROVE" : "REJECT";
        await _auditService.LogAsync(actionType, "Novedad", n.Id.ToString(), $"Estado de novedad cambiado a {n.Status} mediante acción {logAction}");

        // Dispatch notifications to the employee in background/safe manner
        if (n.Empleado != null && n.Empleado.UserId.HasValue)
        {
            var empUser = await _context.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Id == n.Empleado.UserId.Value);

            if (empUser != null)
            {
                var title = "";
                var message = "";
                
                if (logAction == "Aprobó (Gerente)")
                {
                    title = $"✅ Solicitud Aprobada por Gerente - {n.NovedadTipo.Nombre}";
                    message = $"Tu solicitud de {n.NovedadTipo.Nombre} para el periodo {n.FechaInicio:dd/MM/yyyy} al {n.FechaFin:dd/MM/yyyy} ha sido aprobada por tu Gerente de Tienda y ha pasado a revisión de Administración/RH.\n\nComentario: {dto.Comentario}";
                }
                else if (logAction == "Rechazó (Gerente)")
                {
                    title = $"❌ Solicitud Rechazada por Gerente - {n.NovedadTipo.Nombre}";
                    message = $"Tu solicitud de {n.NovedadTipo.Nombre} para el periodo {n.FechaInicio:dd/MM/yyyy} al {n.FechaFin:dd/MM/yyyy} ha sido rechazada por tu Gerente de Tienda.\n\nMotivo: {dto.Comentario}";
                }
                else if (logAction == "Aprobó")
                {
                    title = $"🎉 Solicitud Aprobada - {n.NovedadTipo.Nombre}";
                    message = $"Tu solicitud de {n.NovedadTipo.Nombre} para el periodo {n.FechaInicio:dd/MM/yyyy} al {n.FechaFin:dd/MM/yyyy} ha sido aprobada por Administración/RH.\n\nComentario: {dto.Comentario}";
                }
                else if (logAction == "Rechazó")
                {
                    title = $"❌ Solicitud Rechazada - {n.NovedadTipo.Nombre}";
                    message = $"Tu solicitud de {n.NovedadTipo.Nombre} para el periodo {n.FechaInicio:dd/MM/yyyy} al {n.FechaFin:dd/MM/yyyy} ha sido rechazada por Administración/RH.\n\nMotivo: {dto.Comentario}";
                }

                if (!string.IsNullOrEmpty(title))
                {
                    try
                    {
                        if (!string.IsNullOrEmpty(empUser.FirebaseToken))
                        {
                            await _notificationService.SendNotificationAsync(new NotificationRequest
                            {
                                UserId = empUser.Id,
                                To = empUser.FirebaseToken,
                                Subject = title,
                                Message = message,
                                Type = NotificationType.Push,
                                Category = "novedad_status",
                                Metadata = new Dictionary<string, string> { { "novedadId", n.Id.ToString() } }
                            });
                        }
                        else
                        {
                            await _notificationService.SendNotificationAsync(new NotificationRequest
                            {
                                UserId = empUser.Id,
                                Subject = title,
                                Message = message,
                                Type = NotificationType.Push,
                                Category = "novedad_status",
                                Metadata = new Dictionary<string, string> { { "novedadId", n.Id.ToString() } }
                            });
                        }

                        if (!string.IsNullOrEmpty(empUser.Email))
                        {
                            await _notificationService.SendNotificationAsync(new NotificationRequest
                            {
                                To = empUser.Email,
                                Subject = title,
                                Message = $"<div style='font-family: sans-serif; padding: 20px;'>{message.Replace("\n", "<br/>")}</div>",
                                Type = NotificationType.Email,
                                Category = "novedad_status"
                            });
                        }
                    }
                    catch (Exception)
                    {
                        // Ignore notification failures to ensure transaction completes
                    }
                }
            }
        }

        return NoContent();
    }

    [HttpGet("my-requests")]
    public async Task<ActionResult<IEnumerable<NovedadDto>>> GetMyRequests(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] NovedadStatus? status = null)
    {
        var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var employee = await _context.Employees.FirstOrDefaultAsync(e => e.UserId == userId);
        
        if (employee == null) return Ok(new List<NovedadDto>());

        var query = _context.Novedades
            .Include(n => n.NovedadTipo)
            .Include(n => n.Empleado)
            .Where(n => n.EmpleadoId == employee.Id);

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
                CreatedBy = n.Logs.Where(l => l.Accion == "Creó").Select(l => l.Usuario.FullName).FirstOrDefault() ?? "Empleado"
            })
            .OrderByDescending(n => n.FechaInicio)
            .ToListAsync();
    }

    [HttpGet("my-news")]
    public async Task<ActionResult<IEnumerable<NovedadDto>>> GetMyNews()
    {
        var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var employee = await _context.Employees.FirstOrDefaultAsync(e => e.UserId == userId);
        
        if (employee == null) return Ok(new List<NovedadDto>());

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
