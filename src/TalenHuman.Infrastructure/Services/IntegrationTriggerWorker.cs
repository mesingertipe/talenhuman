using Cronos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TalenHuman.Infrastructure.Persistence;
using TalenHuman.Domain.Entities;

namespace TalenHuman.Infrastructure.Services;

public class IntegrationTriggerWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<IntegrationTriggerWorker> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public IntegrationTriggerWorker(
        IServiceProvider serviceProvider,
        ILogger<IntegrationTriggerWorker> logger,
        IHttpClientFactory httpClientFactory)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Integration Trigger Worker is starting.");

        // Loop runs every minute to evaluate cron expressions
        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.UtcNow;
            
            // Align to the next minute
            var nextMinute = new DateTime(now.Year, now.Month, now.Day, now.Hour, now.Minute, 0, DateTimeKind.Utc).AddMinutes(1);
            var delay = nextMinute - now;

            if (delay.TotalMilliseconds > 0)
            {
                await Task.Delay(delay, stoppingToken);
            }

            try
            {
                await ProcessTriggersAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing ProcessTriggersAsync.");
            }
        }
    }

    private async Task ProcessTriggersAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // Disable query filters to get triggers from all tenants (since this is a global background worker)
        var triggers = await context.IntegrationTriggers
            .IgnoreQueryFilters()
            .Where(t => t.IsActive)
            .ToListAsync(stoppingToken);

        var currentUtcMinute = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, DateTime.UtcNow.Day, DateTime.UtcNow.Hour, DateTime.UtcNow.Minute, 0, DateTimeKind.Utc);

        foreach (var trigger in triggers)
        {
            try
            {
                var expression = CronExpression.Parse(trigger.CronExpression);
                
                // We check if the cron expression was scheduled to run at this exact minute
                // By getting the next occurrence from a minute ago
                var previousMinute = currentUtcMinute.AddMinutes(-1).AddSeconds(59);
                var nextOccurrence = expression.GetNextOccurrence(previousMinute);

                if (nextOccurrence.HasValue && nextOccurrence.Value == currentUtcMinute)
                {
                    _logger.LogInformation($"Triggering Job: {trigger.Name} at {currentUtcMinute}");
                    
                    // Fire and forget (don't block the loop)
                    _ = Task.Run(() => ExecuteTriggerAsync(trigger.Id), stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Invalid cron expression for trigger {trigger.Id}: {trigger.CronExpression}");
            }
        }
    }

    private async Task ExecuteTriggerAsync(Guid triggerId)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var trigger = await context.IntegrationTriggers
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == triggerId);

        if (trigger == null) return;

        var client = _httpClientFactory.CreateClient("IntegrationTriggerClient");
        var log = new IntegrationTriggerLog
        {
            Id = Guid.NewGuid(),
            IntegrationTriggerId = trigger.Id,
            CompanyId = trigger.CompanyId,
            ExecutedAt = DateTime.UtcNow
        };

        try
        {
            var response = await client.GetAsync(trigger.TargetUrl);
            log.StatusCode = (int)response.StatusCode;
            log.IsSuccess = response.IsSuccessStatusCode;
            log.ResponseBody = await response.Content.ReadAsStringAsync();
            
            // Truncate response if too large to prevent DB bloat
            if (log.ResponseBody != null && log.ResponseBody.Length > 2000)
            {
                log.ResponseBody = log.ResponseBody.Substring(0, 2000) + "...[TRUNCATED]";
            }
        }
        catch (Exception ex)
        {
            log.StatusCode = 0;
            log.IsSuccess = false;
            log.ResponseBody = ex.Message;
        }

        context.IntegrationTriggerLogs.Add(log);
        
        // Clean up old logs (keep last 10)
        var logsToKeep = await context.IntegrationTriggerLogs
            .IgnoreQueryFilters()
            .Where(l => l.IntegrationTriggerId == trigger.Id)
            .OrderByDescending(l => l.ExecutedAt)
            .Take(9) // We are adding 1, so keep 9 + 1 = 10
            .Select(l => l.Id)
            .ToListAsync();
            
        var oldLogs = await context.IntegrationTriggerLogs
            .IgnoreQueryFilters()
            .Where(l => l.IntegrationTriggerId == trigger.Id && !logsToKeep.Contains(l.Id))
            .ToListAsync();
            
        if (oldLogs.Any())
        {
            context.IntegrationTriggerLogs.RemoveRange(oldLogs);
        }

        await context.SaveChangesAsync();
    }
}
