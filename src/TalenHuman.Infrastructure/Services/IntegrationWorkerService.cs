using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;
using System.Net.Http.Json;

namespace TalenHuman.Infrastructure.Services;

public class IntegrationWorkerService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<IntegrationWorkerService> _logger;
    private readonly HttpClient _httpClient;

    public IntegrationWorkerService(IServiceProvider serviceProvider, ILogger<IntegrationWorkerService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _httpClient = new HttpClient();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Integration Worker Service started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessIntegrationsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Integration Worker execution loop.");
            }

            // Check every 5 minutes (or as configured)
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }

    private async Task ProcessIntegrationsAsync(CancellationToken token)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        // Get all configs that have auto-sync enabled
        var configs = await dbContext.ExternalApiConfigs
            .IgnoreQueryFilters()
            .Where(c => c.EnableAutoSync)
            .ToListAsync(token);

        foreach (var config in configs)
        {
            // Only process if enough time has passed since last sync
            if (config.LastSyncAt.HasValue && 
                DateTime.UtcNow < config.LastSyncAt.Value.AddMinutes(config.SyncIntervalMinutes))
            {
                continue;
            }

            _logger.LogInformation("Starting sync for Tenant: {TenantId}, Provider: {Provider}", config.CompanyId, config.Provider);
            
            try 
            {
                if (config.Provider == IntegrationProvider.FalconCloud)
                {
                    await SyncFalconCloudAsync(config, dbContext, token);
                }
                
                config.LastSyncAt = DateTime.UtcNow;
                await dbContext.SaveChangesAsync(token);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Sync failed for Tenant: {TenantId}", config.CompanyId);
            }
        }
    }

    private async Task SyncFalconCloudAsync(ExternalApiConfig config, IApplicationDbContext db, CancellationToken token)
    {
        // 1. Login to Falcon Cloud
        // (Simplified logic based on the PDF spec: EnterpriseId, User, Pass, Srv)
        // Note: Real implementation would handle cookie/token storage
        
        _logger.LogInformation("Falcon Cloud Sync: Authenticating and Polling data...");
        
        // Placeholder for the actual SOAP/REST calls defined in the PDF
        // Since we are implementing the architecture, we set up the lifecycle
        
        // Example: Get Employees and Upsert
        // var remoteEmployees = await FetchFalconEmployees(config);
        // await UpsertEmployees(remoteEmployees, config.CompanyId, db);
    }
}
