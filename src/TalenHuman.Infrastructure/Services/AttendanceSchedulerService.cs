using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TalenHuman.Application.Services;
using TalenHuman.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace TalenHuman.Infrastructure.Services;

public class AttendanceSchedulerService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AttendanceSchedulerService> _logger;
    private DateTime? _lastRunDate;

    public AttendanceSchedulerService(IServiceProvider serviceProvider, ILogger<AttendanceSchedulerService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Attendance Scheduler Background Service is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.Now;
            
            // Trigger At 06:05 AM every day
            if (now.Hour == 6 && now.Minute >= 5 && now.Minute <= 15 && _lastRunDate?.Date != now.Date)
            {
                _logger.LogInformation("Triggering automatic attendance consolidation and reporting...");
                
                try 
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
                        var attendanceService = scope.ServiceProvider.GetRequiredService<AttendanceService>();
                        var reportService = scope.ServiceProvider.GetRequiredService<AttendanceReportService>();

                        // Iterate through companies (tenants)
                        var companies = await context.Companies.ToListAsync();
                        var yesterday = now.AddDays(-1);

                        foreach (var company in companies)
                        {
                            _logger.LogInformation("Processing auto-report for Company: {Name}", company.Name);
                            
                            // 1. Consolidate
                            await attendanceService.ConsolidateDailyAttendanceAsync(yesterday, company.Id);
                            
                            // 2. Send Reports
                            await reportService.SendAutomaticDailyReportsAsync(company.Id, yesterday);
                        }
                    }
                    
                    _lastRunDate = now;
                    _logger.LogInformation("Automatic daily cycle completed successfully.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error during automatic attendance cycle.");
                }
            }

            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }
}
