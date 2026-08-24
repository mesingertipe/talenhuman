using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;
using TalenHuman.Infrastructure.Persistence;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AIChatController : ControllerBase
{
    private readonly IGeminiAIService _aiService;
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public AIChatController(IGeminiAIService aiService, ApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _aiService = aiService;
        _context = context;
        _tenantProvider = tenantProvider;
    }

    public class ChatMessageRequest
    {
        public string Message { get; set; } = string.Empty;
    }

    [HttpGet("init")]
    public async Task<IActionResult> InitChat()
    {
        var userName = User.Identity?.Name ?? "Usuario";
        var firstNameClaim = User.FindFirst("FirstName")?.Value;
        if (!string.IsNullOrEmpty(firstNameClaim)) userName = firstNameClaim;

        var roles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList();
        
        var suggestions = new List<string>();

        if (roles.Contains("SuperAdmin"))
        {
            suggestions.Add("¿Cuántos empleados activos hay en total en todas las empresas?");
            suggestions.Add("¿Qué empresa tiene más novedades pendientes?");
        }
        else if (roles.Contains("Admin") || roles.Contains("RH"))
        {
            suggestions.Add("¿Cuántas novedades pendientes tenemos en la compañía?");
            suggestions.Add("¿Qué tienda tiene mayor rotación o inactividad?");
        }
        else if (roles.Contains("Distrital"))
        {
            suggestions.Add("¿Cuántas asistencias correctas hay hoy en mi zona?");
            suggestions.Add("¿Qué tienda de mi distrito tiene más faltas?");
        }
        else
        {
            suggestions.Add("¿Cuántas novedades pendientes tengo en mi tienda?");
            suggestions.Add("¿Cuántos empleados entraron hoy en mi tienda?");
        }

        var companyId = _tenantProvider.GetTenantId();
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
            return Unauthorized();
            
        var activeSession = await _context.AIChatSessions
            .Include(s => s.Messages)
            .FirstOrDefaultAsync(s => s.UserId == userId && s.CompanyId == companyId && s.IsActive);
            
        var history = activeSession?.Messages.Select(m => (object)new { role = m.Role, text = m.Content }).ToList() ?? new List<object>();

        return Ok(new
        {
            greeting = $"¡Hola {userName}! Soy TalentIA, tu asistente experto en RRHH. ¿En qué te puedo ayudar hoy?",
            suggestions = suggestions,
            history = history
        });
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendMessage([FromBody] ChatMessageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
            return BadRequest(new { error = "El mensaje no puede estar vacío." });

        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
            return Unauthorized();

        var rolesStr = User.Claims.Where(c => c.Type == System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList();
        var isSuperAdmin = rolesStr.Contains("SuperAdmin");
        
        var companyId = _tenantProvider.GetTenantId();
        var company = await _context.Companies.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Id == companyId);
        
        if (!isSuperAdmin)
        {
            if (company == null || !company.IsAiEnabled)
                return StatusCode(403, new { error = "El módulo de Inteligencia Artificial no está habilitado para esta empresa." });

            var allowedRoles = company.AiAllowedRoles?.Split(',', StringSplitOptions.RemoveEmptyEntries) ?? Array.Empty<string>();
            bool hasAccess = rolesStr.Any(r => allowedRoles.Contains(r.Trim()));
            if (!hasAccess)
                return StatusCode(403, new { error = "No tienes permisos para acceder al asistente virtual." });
        }
        
        var userName = User.FindFirst("FirstName")?.Value ?? User.Identity?.Name ?? "Usuario";
        var roles = rolesStr;
        
        string activeRole = "Usuario";
        Guid? userStoreId = null;
        Guid? userDistrictId = null;

        if (roles.Contains("SuperAdmin")) {
            activeRole = "SuperAdmin";
        } else if (roles.Contains("Admin") || roles.Contains("RH")) {
            activeRole = "Admin";
        } else if (roles.Contains("Distrital")) {
            activeRole = "Supervisor";
            var user = await _context.Users.FindAsync(userId);
            userDistrictId = user?.DistrictId;
        } else {
            activeRole = "Gerente"; // O Rol general con alcance de tienda
            var allowedStoreIds = await _context.Set<SupervisorStore>()
                .Where(ss => ss.UserId == userId && ss.CompanyId == companyId)
                .Select(ss => ss.StoreId)
                .ToListAsync();
            
            userStoreId = allowedStoreIds.FirstOrDefault();
        }
        
        var activeSession = await _context.AIChatSessions
            .Include(s => s.Messages)
            .FirstOrDefaultAsync(s => s.UserId == userId && s.CompanyId == companyId && s.IsActive);
            
        if (activeSession == null)
        {
            activeSession = new AIChatSession { UserId = userId, CompanyId = companyId };
            _context.AIChatSessions.Add(activeSession);
        }
        
        var userMsg = new AIChatMessage { Role = "user", Content = request.Message };
        activeSession.Messages.Add(userMsg);
        await _context.SaveChangesAsync();
        
        var history = activeSession.Messages.Where(m => m.Id != userMsg.Id).ToList();

        try
        {
            string responseText = await _aiService.GetResponseAsync(
                prompt: request.Message,
                userRole: activeRole,
                userName: userName,
                companyId: companyId,
                storeId: userStoreId,
                districtId: userDistrictId,
                history: history
            );
            
            var modelMsg = new AIChatMessage { Role = "model", Content = responseText };
            activeSession.Messages.Add(modelMsg);
            activeSession.LastUpdatedAt = TalenHuman.Domain.Common.ColombiaTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { response = responseText });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = $"Error interno: {ex.Message}" });
        }
    }
    
    [HttpDelete("clear")]
    public async Task<IActionResult> ClearChat()
    {
        var companyId = _tenantProvider.GetTenantId();
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
            return Unauthorized();
            
        var activeSession = await _context.AIChatSessions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.CompanyId == companyId && s.IsActive);
            
        if (activeSession != null)
        {
            activeSession.IsActive = false;
            await _context.SaveChangesAsync();
        }
        
        return Ok(new { message = "Chat limpiado" });
    }
}
