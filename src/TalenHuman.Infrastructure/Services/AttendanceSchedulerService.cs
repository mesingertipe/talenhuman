using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TalenHuman.Application.Services;
using TalenHuman.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Domain.Common;
using TalenHuman.Domain.Entities;

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

    private readonly Dictionary<Guid, DateTime> _lastRunDatesByCompany = new Dictionary<Guid, DateTime>();

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Attendance Scheduler Background Service is starting.");
 
        while (!stoppingToken.IsCancellationRequested)
        {
            try 
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
                    var attendanceService = scope.ServiceProvider.GetRequiredService<AttendanceService>();
                    var reportService = scope.ServiceProvider.GetRequiredService<AttendanceReportService>();
                    
                    // Get all active companies
                    var companies = await context.Companies.Where(c => c.IsActive).ToListAsync();

                    foreach (var company in companies)
                    {
                        try 
                        {
                            // 1. Get Local Time for this company
                            var timeZone = TimeZoneInfo.FindSystemTimeZoneById(company.TimeZoneId ?? "SA Pacific Standard Time");
                            var companyNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone);
                            
                            // 2. Fetch Setting for this specific company using prefix strategy
                            var prefixedKey = $"{company.Id}_AttendanceConsolidationTime";
                            var setting = await context.SystemSettings
                                .FirstOrDefaultAsync(s => s.Key == prefixedKey);
                            
                            // Fallback to global if not found
                            if (setting == null)
                            {
                                setting = await context.SystemSettings
                                    .FirstOrDefaultAsync(s => s.Key == "AttendanceConsolidationTime");
                            }
                            
                            var configTimeStr = setting?.Value ?? "06:00";

                            if (TimeSpan.TryParse(configTimeStr, out var configTime))
                            {
                                // Check if we should execute (Time matches and not already run today for THIS company)
                                if (companyNow.Hour == configTime.Hours && 
                                    companyNow.Minute >= configTime.Minutes && 
                                    companyNow.Minute < (configTime.Minutes + 10) && 
                                    (!_lastRunDatesByCompany.TryGetValue(company.Id, out var lastRun) || lastRun.Date != companyNow.Date))
                                {
                                    _logger.LogInformation("Triggering scheduled cycle for {Name} at {Time} (Local Time: {Local})", 
                                        company.Name, configTimeStr, companyNow.ToString("HH:mm"));
                                    
                                    var yesterday = companyNow.AddDays(-1).Date;

                                    // 1. Consolidate (passing Scheduled as type)
                                    await attendanceService.ConsolidateDailyAttendanceAsync(yesterday, company.Id, ExecutionType.Scheduled);
                                    
                                    // 2. Send Reports
                                    await reportService.SendAutomaticDailyReportsAsync(company.Id, yesterday);
                                    
                                    _lastRunDatesByCompany[company.Id] = companyNow;
                                    _logger.LogInformation("Scheduled cycle for {Name} completed.", company.Name);
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error processing company {Name} during scheduled cycle.", company.Name);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Critical error in attendance scheduler loop.");
            }
 
            // Check every 1 minute
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}
