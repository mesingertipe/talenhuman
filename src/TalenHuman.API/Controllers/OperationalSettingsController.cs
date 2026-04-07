using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OperationalSettingsController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public OperationalSettingsController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<OperationalSetting>> GetSettings()
    {
        var settings = await _context.OperationalSettings.FirstOrDefaultAsync();
        
        if (settings == null)
        {
            // Initialize with defaults if none exist
            settings = new OperationalSetting();
            _context.OperationalSettings.Add(settings);
            await _context.SaveChangesAsync(CancellationToken.None);
        }
        
        return settings;
    }

    [HttpPost]
    public async Task<ActionResult<OperationalSetting>> UpdateSettings(OperationalSetting settings)
    {
        var existing = await _context.OperationalSettings.FirstOrDefaultAsync();
        
        if (existing == null)
        {
            _context.OperationalSettings.Add(settings);
        }
        else
        {
            existing.AttendanceMode = settings.AttendanceMode;
            existing.ShiftApprovalMode = settings.ShiftApprovalMode;
            existing.EnablePushNotifications = settings.EnablePushNotifications;
            existing.EnableEmailNotifications = settings.EnableEmailNotifications;
            _context.OperationalSettings.Update(existing);
        }

        await _context.SaveChangesAsync(CancellationToken.None);
        return Ok(existing ?? settings);
    }
}
