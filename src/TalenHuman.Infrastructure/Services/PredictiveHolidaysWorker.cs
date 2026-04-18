using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TalenHuman.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace TalenHuman.Infrastructure.Services;

public class PredictiveHolidaysWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<PredictiveHolidaysWorker> _logger;

    public PredictiveHolidaysWorker(IServiceProvider serviceProvider, ILogger<PredictiveHolidaysWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Predictive Holidays Worker is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
                    var holidayService = scope.ServiceProvider.GetRequiredService<IPredictiveHolidaysService>();

                    await EnsureHolidaysAreSeededAsync(context, holidayService);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Predictive Holidays Worker loop.");
            }

            // Run once every 24 hours
            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }

    private async Task EnsureHolidaysAreSeededAsync(IApplicationDbContext context, IPredictiveHolidaysService holidayService)
    {
        var currentYear = DateTime.UtcNow.Year;
        var countries = new[] { "CO", "MX" };

        foreach (var country in countries)
        {
            // We ensure current year and the next 2 years are seeded
            for (int year = currentYear; year <= currentYear + 2; year++)
            {
                var exists = await context.PredictiveSpecialDates
                    .IgnoreQueryFilters()
                    .AnyAsync(d => d.Country == country && d.Date.Year == year && d.IsSystem);

                if (!exists)
                {
                    _logger.LogInformation("Seeding holidays for {Country} year {Year}...", country, year);
                    var holidays = holidayService.GenerateHolidays(year, country);
                    context.PredictiveSpecialDates.AddRange(holidays);
                    await context.SaveChangesAsync(CancellationToken.None);
                }
            }
        }
    }
}
