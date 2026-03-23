using Microsoft.AspNetCore.Http;
using TalenHuman.Application.Common.Interfaces;
using System.Security.Claims;

namespace TalenHuman.Infrastructure.Services;

public class TenantProvider : ITenantProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid GetTenantId()
    {
        var context = _httpContextAccessor.HttpContext;
        if (context == null) return Guid.Empty;

        // Try to get from Header (X-Tenant-Id)
        var headerValue = context.Request.Headers["X-Tenant-Id"].ToString();
        if (!string.IsNullOrEmpty(headerValue) && Guid.TryParse(headerValue, out var tenantId))
        {
            // If user is not authenticated (Login) or is Admin/SuperAdmin, allow switching.
            if (!(context.User.Identity?.IsAuthenticated ?? false) || 
                context.User.IsInRole("Admin") || 
                context.User.IsInRole("SuperAdmin"))
            {
                return tenantId;
            }
        }

        // Try to get from Claims (CompanyId)
        var user = context.User;
        var claimTenantId = user?.FindFirst("CompanyId")?.Value;
        if (Guid.TryParse(claimTenantId, out var cId))
        {
            return cId;
        }

        return Guid.Empty;
    }
}
