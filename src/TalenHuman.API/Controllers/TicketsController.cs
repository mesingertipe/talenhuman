using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using TalenHuman.Domain.Entities;
using TalenHuman.Infrastructure.Persistence;
using TalenHuman.API.Hubs;
using TalenHuman.Application.Common.Interfaces;

namespace TalenHuman.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class TicketsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<TicketHub> _hubContext;
    private readonly IEmailService _emailService;

    public TicketsController(ApplicationDbContext context, IHubContext<TicketHub> hubContext, IEmailService emailService)
    {
        _context = context;
        _hubContext = hubContext;
        _emailService = emailService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SupportTicket>>> GetTickets()
    {
        var role = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
        if (role == "Empleado") return Forbid();

        var userId = Guid.Parse(User.Claims.First(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier).Value);

        var query = _context.SupportTickets
            .Include(t => t.CreatedByUser)
            .Include(t => t.AssignedToUser)
            .AsQueryable();

        if (role == "SuperAdmin" || role == "Soporte")
        {
            query = query.IgnoreQueryFilters();
        }
        else
        {
            query = query.Where(t => t.CreatedByUserId == userId);
        }

        return await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SupportTicket>> GetTicket(Guid id)
    {
        var role = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
        if (role == "Empleado") return Forbid();

        var userId = Guid.Parse(User.Claims.First(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier).Value);

        var query = _context.SupportTickets
            .Include(t => t.CreatedByUser)
            .Include(t => t.AssignedToUser)
            .Include(t => t.Messages)
            .ThenInclude(m => m.User)
            .AsQueryable();

        if (role == "SuperAdmin" || role == "Soporte")
        {
            query = query.IgnoreQueryFilters();
        }

        var ticket = await query.FirstOrDefaultAsync(t => t.Id == id);
        if (ticket == null) return NotFound();

        // Normal user can only see their own tickets
        if (role != "SuperAdmin" && role != "Soporte" && ticket.CreatedByUserId != userId)
        {
            return Forbid();
        }

        return ticket;
    }

    [HttpPost]
    public async Task<ActionResult<SupportTicket>> CreateTicket(SupportTicket ticket)
    {
        var role = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
        if (role == "Empleado") return Forbid();

        var userId = Guid.Parse(User.Claims.First(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier).Value);
        ticket.CreatedByUserId = userId;
        ticket.TicketNumber = "TK-" + DateTime.UtcNow.ToString("yyyyMM") + "-" + new Random().Next(1000, 9999);
        
        _context.SupportTickets.Add(ticket);
        await _context.SaveChangesAsync();
        
        // Notify Support and SuperAdmin
        var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId);
        try {
            var supportRoleIds = await _context.Roles.Where(r => r.Name == "Soporte" || r.Name == "SuperAdmin").Select(r => r.Id).ToListAsync();
            var supportUserIds = await _context.UserRoles.Where(ur => supportRoleIds.Contains(ur.RoleId)).Select(ur => ur.UserId).ToListAsync();
            var supportUsers = await _context.Users.IgnoreQueryFilters().Where(u => supportUserIds.Contains(u.Id)).ToListAsync();
            foreach (var su in supportUsers)
            {
                if (!string.IsNullOrEmpty(su.Email))
                {
                    await _emailService.SendEmailAsync(su.Email, 
                        $"Nuevo Ticket: {ticket.TicketNumber}", 
                        $"El usuario {user?.FullName} ha creado un nuevo ticket.\nAsunto: {ticket.Subject}\nDescripción: {ticket.Description}");
                }
            }
        } catch { /* Ignore email errors */ }
        
        return CreatedAtAction(nameof(GetTicket), new { id = ticket.Id }, ticket);
    }

    [HttpPost("{id}/messages")]
    public async Task<ActionResult<TicketMessage>> AddMessage(Guid id, TicketMessage message)
    {
        var role = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
        if (role == "Empleado") return Forbid();

        var userId = Guid.Parse(User.Claims.First(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier).Value);

        var query = _context.SupportTickets.AsQueryable();
        if (role == "SuperAdmin" || role == "Soporte")
        {
            query = query.IgnoreQueryFilters();
        }

        var ticket = await query.FirstOrDefaultAsync(t => t.Id == id);
        if (ticket == null) return NotFound();

        if (role != "SuperAdmin" && role != "Soporte" && ticket.CreatedByUserId != userId)
        {
            return Forbid();
        }

        message.SupportTicketId = id;
        message.UserId = userId;
        message.IsFromSupport = (role == "SuperAdmin" || role == "Soporte");
        message.CompanyId = ticket.CompanyId; // Ensure message gets the right tenant

        _context.TicketMessages.Add(message);
        
        // Update ticket status
        if (message.IsFromSupport && ticket.Status == SupportTicketStatus.Open)
        {
            ticket.Status = SupportTicketStatus.InProgress;
        }

        await _context.SaveChangesAsync();

        // Broadcast via SignalR to anyone in the ticket room
        // Reload user info to broadcast full name
        var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId);
        message.User = user;

        await _hubContext.Clients.Group(id.ToString()).SendAsync("ReceiveMessage", message);

        // Send email notification
        try {
            if (message.IsFromSupport)
            {
                var creator = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == ticket.CreatedByUserId);
                if (creator != null) {
                    await _emailService.SendEmailAsync(creator.Email!, 
                        $"Nuevo mensaje en tu ticket {ticket.TicketNumber}", 
                        $"Soporte ha respondido a tu ticket: {ticket.Subject}\n\nMensaje: {message.Message}");
                }
            }
            else
            {
                var supportRoleIds = await _context.Roles.Where(r => r.Name == "Soporte" || r.Name == "SuperAdmin").Select(r => r.Id).ToListAsync();
                var supportUserIds = await _context.UserRoles.Where(ur => supportRoleIds.Contains(ur.RoleId)).Select(ur => ur.UserId).ToListAsync();
                var supportUsers = await _context.Users.IgnoreQueryFilters().Where(u => supportUserIds.Contains(u.Id)).ToListAsync();
                foreach (var su in supportUsers)
                {
                    if (!string.IsNullOrEmpty(su.Email))
                    {
                        await _emailService.SendEmailAsync(su.Email, 
                            $"Nuevo mensaje de usuario en ticket {ticket.TicketNumber}", 
                            $"El usuario {user?.FullName} ha respondido al ticket: {ticket.Subject}\n\nMensaje: {message.Message}");
                    }
                }
            }
        } catch { /* ignore */ }

        return Ok(message);
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "SuperAdmin,Soporte")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] SupportTicketStatus status)
    {
        var ticket = await _context.SupportTickets.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == id);
        if (ticket == null) return NotFound();

        ticket.Status = status;
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
