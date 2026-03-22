using Microsoft.AspNetCore.Mvc;
using TalenHuman.Application.Common.Interfaces;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConfigController : ControllerBase
{
    private readonly ITenantProvider _tenantProvider;

    public ConfigController(ITenantProvider tenantProvider)
    {
        _tenantProvider = tenantProvider;
    }

    [HttpGet("tenant")]
    public IActionResult GetCurrentTenant()
    {
        var tenantId = _tenantProvider.GetTenantId();
        return Ok(new { TenantId = tenantId });
    }
}
