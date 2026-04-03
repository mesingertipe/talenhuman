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
    private static readonly HashSet<Guid> _notifiedShifts = new HashSet<Guid>();
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
                    var auditService = scope.ServiceProvider.GetRequiredService<IAuditService>();
                    
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
                                    
                                    // 3. Cleanup old audit logs (retention setting)
                                    var auditRetKey = $"{company.Id}_AuditRetentionDays";
                                    var auditRetSetting = await context.SystemSettings.FirstOrDefaultAsync(s => s.Key == auditRetKey) ?? await context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "AuditRetentionDays");
                                    int auditDaysToKeep = 60; // Default 60 days
                                    if (auditRetSetting != null && int.TryParse(auditRetSetting.Value, out int customAuditDays)) {
                                        auditDaysToKeep = customAuditDays;
                                    }
                                    await auditService.CleanupOldLogsAsync(company.Id, auditDaysToKeep);
                                    
                                    _lastRunDatesByCompany[company.Id] = companyNow;
                                    _logger.LogInformation("Scheduled cycle for {Name} completed.", company.Name);
                                }

                                // 🟢 ELITE V65.1: Proactive Shift Reminders (Check every minute)
                                await CheckAndSendShiftRemindersAsync(context, company.Id, companyNow);
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

    private async Task CheckAndSendShiftRemindersAsync(IApplicationDbContext context, Guid companyId, DateTime companyNow)
    {
        try 
        {
            var notificationService = _serviceProvider.GetRequiredService<NotificationService>();
            
            // Look for shifts starting in 14-16 minutes (window to catch 15 min mark)
            var targetTimeStart = companyNow.AddMinutes(14);
            var targetTimeEnd = companyNow.AddMinutes(16);

            var upcomingShifts = await context.Shifts
                .Where(s => s.CompanyId == companyId && s.StartTime >= targetTimeStart && s.StartTime <= targetTimeEnd)
                .Where(s => !s.IsDescanso)
                .Include(s => s.Employee)
                .ThenInclude(e => e.User)
                .ToListAsync();

            foreach (var shift in upcomingShifts)
            {
                if (_notifiedShifts.Contains(shift.Id)) continue;

                var user = shift.Employee?.User;
                if (user != null && !string.IsNullOrEmpty(user.FirebaseToken))
                {
                    await notificationService.SendNotificationAsync(new NotificationRequest
                    {
                        To = user.FirebaseToken,
                        Type = NotificationType.Push,
                        Subject = "⏳ Turno por iniciar",
                        Message = $"Hola {user.FullName}, tu turno está programado para iniciar a las {shift.StartTime:HH:mm}. ¡Prepárate!"
                    });

                    _notifiedShifts.Add(shift.Id);
                    _logger.LogInformation("Shift reminder sent for {Employee} (Shift: {Id})", user.FullName, shift.Id);
                }
            }

            // Cleanup old notified shifts once a day
            if (_notifiedShifts.Count > 1000) _notifiedShifts.Clear();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in CheckAndSendShiftRemindersAsync");
        }
    }
}
