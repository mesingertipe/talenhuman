using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;

namespace TalenHuman.Infrastructure.Middleware;

public class TenantApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    private const string API_KEY_HEADER = "X-Api-Key";
    private const string TENANT_ID_HEADER = "X-Tenant-Id";

    public TenantApiKeyMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IApplicationDbContext dbContext)
    {
        // Only process integration endpoints
        if (context.Request.Path.StartsWithSegments("/api/integration"))
        {
            if (!context.Request.Headers.TryGetValue(API_KEY_HEADER, out var extractedApiKey))
            {
                context.Response.StatusCode = 401; // Unauthorized
                await context.Response.WriteAsync("API Key was not provided.");
                return;
            }

            // Look up the API Key in the database (ignoring global filters for this system lookup)
            var apiKeyRecord = await dbContext.ApiKeys
                .IgnoreQueryFilters() 
                .FirstOrDefaultAsync(x => x.Key == extractedApiKey.ToString() && x.IsActive);

            if (apiKeyRecord == null)
            {
                context.Response.StatusCode = 401; // Unauthorized
                await context.Response.WriteAsync("Unauthorized client.");
                return;
            }

            // Set the Tenant ID in the request context for TenantProvider to use
            context.Request.Headers[TENANT_ID_HEADER] = apiKeyRecord.CompanyId.ToString();
        }

        await _next(context);
    }
}
