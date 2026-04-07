using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;

namespace TalenHuman.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class OperationalSettingsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public OperationalSettingsController(IApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    public async Task<ActionResult<OperationalSetting>> GetSettings()
    {
        // Global filter handles CompanyId, but we explicitly ensure one record
        var settings = await _context.OperationalSettings.FirstOrDefaultAsync();
        
        if (settings == null)
        {
            settings = new OperationalSetting();
            _context.OperationalSettings.Add(settings);
            await _context.SaveChangesAsync(CancellationToken.None);
        }
        
        return settings;
    }

    [HttpPost]
    public async Task<ActionResult<OperationalSetting>> UpdateSettings([FromBody] OperationalSetting settings)
    {
        var existing = await _context.OperationalSettings.FirstOrDefaultAsync();
        var companyId = _tenantProvider.GetTenantId();
        var userEmail = User.Identity?.Name ?? "Unknown";

        if (existing == null)
        {
            settings.CompanyId = companyId;
            _context.OperationalSettings.Add(settings);
            existing = settings;
        }
        else
        {
            // Capture old state for audit
            var oldState = JsonSerializer.Serialize(new {
                existing.AttendanceMode,
                existing.ShiftApprovalMode,
                existing.EnableEmailNotifications,
                existing.EnablePushNotifications
            });

            existing.AttendanceMode = settings.AttendanceMode;
            existing.ShiftApprovalMode = settings.ShiftApprovalMode;
            existing.EnablePushNotifications = settings.EnablePushNotifications;
            existing.EnableEmailNotifications = settings.EnableEmailNotifications;
            _context.OperationalSettings.Update(existing);

            // Audit Log implementation
            var audit = new AuditLog {
                CompanyId = companyId,
                Action = "UPDATE",
                EntityType = "OperationalSetting",
                EntityId = existing.Id.ToString(),
                UserName = userEmail,
                Details = $"Cambio de parámetros operativos. Estado anterior: {oldState}",
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(audit);
        }

        await _context.SaveChangesAsync(CancellationToken.None);
        return Ok(existing);
    }
}
