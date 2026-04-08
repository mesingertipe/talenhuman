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
    public async Task<ActionResult<OperationalSetting>> UpdateSettings([FromBody] UpdateOperationalSettingsDto dto)
    {
        var existing = await _context.OperationalSettings.FirstOrDefaultAsync();
        var companyId = _tenantProvider.GetTenantId();
        var userEmail = User.Identity?.Name ?? "Unknown";

        if (existing == null)
        {
            existing = new OperationalSetting
            {
                CompanyId = companyId,
                AttendanceMode = dto.AttendanceMode,
                ShiftApprovalMode = dto.ShiftApprovalMode,
                EnablePushNotifications = dto.EnablePushNotifications,
                EnableEmailNotifications = dto.EnableEmailNotifications
            };
            _context.OperationalSettings.Add(existing);
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

            existing.AttendanceMode = dto.AttendanceMode;
            existing.ShiftApprovalMode = dto.ShiftApprovalMode;
            existing.EnablePushNotifications = dto.EnablePushNotifications;
            existing.EnableEmailNotifications = dto.EnableEmailNotifications;
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

public class UpdateOperationalSettingsDto
{
    public AttendanceMode AttendanceMode { get; set; }
    public ShiftApprovalMode ShiftApprovalMode { get; set; }
    public bool EnablePushNotifications { get; set; }
    public bool EnableEmailNotifications { get; set; }
}
