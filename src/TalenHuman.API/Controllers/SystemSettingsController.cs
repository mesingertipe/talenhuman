using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;

namespace TalenHuman.API.Controllers;

[Authorize(Roles = "SuperAdmin")]
[ApiController]
[Route("api/[controller]")]
public class SystemSettingsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ISystemSettingsService _settingsService;

    public SystemSettingsController(IApplicationDbContext context, ISystemSettingsService settingsService)
    {
        _context = context;
        _settingsService = settingsService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SystemSetting>>> GetSettings()
    {
        return await _context.SystemSettings
            .OrderBy(s => s.Group)
            .ThenBy(s => s.Key)
            .ToListAsync();
    }

    [HttpGet("group/{group}")]
    public async Task<ActionResult<IDictionary<string, string>>> GetGroupSettings(string group)
    {
        return Ok(await _settingsService.GetGroupSettingsAsync(group));
    }

    [HttpPost]
    public async Task<IActionResult> SaveSetting(SaveSettingDto dto)
    {
        await _settingsService.SetSettingAsync(dto.Key, dto.Value, dto.Group, dto.Description);
        return Ok();
    }

    [HttpPost("batch")]
    public async Task<IActionResult> SaveSettings(IEnumerable<SaveSettingDto> settings)
    {
        foreach (var s in settings)
        {
            await _settingsService.SetSettingAsync(s.Key, s.Value, s.Group, s.Description);
        }
        return Ok();
    }
}

public class SaveSettingDto
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Group { get; set; } = "General";
    public string? Description { get; set; }
}
