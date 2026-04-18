using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using System.Linq;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/debug/inspect-ids")]
public class InspectIdsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public InspectIdsController(IApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    public async Task<IActionResult> Inspect()
    {
        var companyId = _tenantProvider.GetTenantId();
        var storeTypes = await _context.StoreTypes
            .IgnoreQueryFilters()
            .Where(st => st.CompanyId == companyId || st.CompanyId == Guid.Empty)
            .Select(st => new { st.Id, st.Name, st.CompanyId })
            .ToListAsync();

        var salesChannels = await _context.SalesChannels
            .IgnoreQueryFilters()
            .Where(sc => sc.CompanyId == companyId || sc.CompanyId == Guid.Empty)
            .Select(sc => new { sc.Id, sc.Name, sc.CompanyId })
            .ToListAsync();

        return Ok(new { 
            currentTenant = companyId,
            storeTypes,
            salesChannels
        });
    }
}
