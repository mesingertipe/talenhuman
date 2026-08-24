using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Common;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;

namespace TalenHuman.Infrastructure.Services;

public class AIChatCleanupWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AIChatCleanupWorker> _logger;
    private const int DaysToKeep = 7;

    public AIChatCleanupWorker(IServiceProvider serviceProvider, ILogger<AIChatCleanupWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AIChatCleanupWorker is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

                    var thresholdDate = ColombiaTime.Now.AddDays(-DaysToKeep);
                    _logger.LogInformation("Starting cleanup of AI Chat Sessions older than {ThresholdDate}...", thresholdDate);

                    int deletedSessions = await context.AIChatSessions
                        .IgnoreQueryFilters()
                        .Where(s => s.LastUpdatedAt < thresholdDate)
                        .ExecuteDeleteAsync(stoppingToken);

                    if (deletedSessions > 0)
                    {
                        _logger.LogInformation("Successfully deleted {Count} old AI Chat Sessions.", deletedSessions);
                    }
                    else
                    {
                        _logger.LogInformation("No old AI Chat Sessions found to delete.");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AIChatCleanupWorker loop.");
            }

            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }
}
