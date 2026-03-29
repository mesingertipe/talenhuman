using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;
using TalenHuman.Domain.Common;

namespace TalenHuman.Application.Services;

public class AttendanceService
{
    private readonly IApplicationDbContext _context;

    public AttendanceService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task ConsolidateDailyAttendanceAsync(DateTime date, Guid companyId)
    {
        var day = date.Date;
        
        // 1. Get all employees for this company
        var employees = await _context.Employees
            .Where(e => e.CompanyId == companyId && e.IsActive)
            .ToListAsync();

        foreach (var employee in employees)
        {
            // 2. Get Employee Shifts for this day (sorted)
            var shifts = await _context.Shifts
                .Where(s => s.EmployeeId == employee.Id && s.StartTime.Date == day && !s.IsDescanso)
                .OrderBy(s => s.StartTime)
                .ToListAsync();

            if (!shifts.Any()) continue;

            // 3. Get all Biometric Records for this employee and day
            var allRecords = await _context.BiometricRecords
                .Where(r => r.CompanyId == companyId && 
                            r.DeviceUser == employee.IdentificationNumber &&
                            r.RecordDate.Date == day)
                .OrderBy(r => r.RecordDate)
                .ToListAsync();

            // Clear previous attendances for this day to allow re-consolidation
            var existingAttendances = await _context.Attendances
                .Where(a => a.EmployeeId == employee.Id && a.ClockIn.Date == day)
                .ToListAsync();
            _context.Attendances.RemoveRange(existingAttendances);

            // Logic for multiple shifts: Match records to closest shift
            var availableRecords = new List<BiometricRecord>(allRecords);

            foreach (var shift in shifts)
            {
                var attendance = new Attendance
                {
                    EmployeeId = employee.Id,
                    StoreId = employee.StoreId,
                    CompanyId = companyId,
                    ShiftId = shift.Id,
                    ClockIn = day // Initial placeholder
                };

                // Find records that fall within a reasonable window of this specific shift
                // (2 hours before start and 2 hours after end)
                var shiftRecords = availableRecords
                    .Where(r => r.RecordDate >= shift.StartTime.AddHours(-2) && 
                                r.RecordDate <= shift.EndTime.AddHours(2))
                    .OrderBy(r => r.RecordDate)
                    .ToList();

                if (shiftRecords.Count == 0)
                {
                    attendance.Status = AttendanceStatus.SinMarcacion;
                    attendance.StatusObservation = "No se encontraron registros biométricos.";
                }
                else if (shiftRecords.Count == 1)
                {
                    attendance.ClockIn = shiftRecords[0].RecordDate;
                    attendance.Status = AttendanceStatus.MarcacionErrada;
                    attendance.StatusObservation = "Falta marcación de salida (Par incompleto).";
                    // Only consume if it's clearly for this shift
                    availableRecords.Remove(shiftRecords[0]);
                }
                else
                {
                    // Match first and last within the window
                    var first = shiftRecords.First();
                    var last = shiftRecords.Last();

                    attendance.ClockIn = first.RecordDate;
                    attendance.ClockOut = last.RecordDate;

                    var diffStart = Math.Abs((first.RecordDate - shift.StartTime).TotalMinutes);
                    var diffEnd = Math.Abs((last.RecordDate - shift.EndTime).TotalMinutes);

                    if (diffStart <= 15 && diffEnd <= 15)
                    {
                        attendance.Status = AttendanceStatus.Correcto;
                        attendance.StatusObservation = "Marcación correcta.";
                    }
                    else
                    {
                        attendance.Status = AttendanceStatus.Desfasado;
                        attendance.StatusObservation = $"Desfase: Entrada {diffStart:F0}m, Salida {diffEnd:F0}m.";
                    }

                    // Remove consumed records from pool
                    foreach (var consumed in shiftRecords) availableRecords.Remove(consumed);
                }

                _context.Attendances.Add(attendance);
            }
        }

        await _context.SaveChangesAsync(CancellationToken.None);
    }

    public async Task CleanupBiometricRecordsAsync(Guid companyId)
    {
        // Get retention setting
        var retentionSetting = await _context.SystemSettings
            .FirstOrDefaultAsync(s => s.Key == "BiometricRetentionDays");
        
        int days = 7; // Default
        if (retentionSetting != null && int.TryParse(retentionSetting.Value, out int customDays))
        {
            days = customDays;
        }

        var cutoffDate = ColombiaTime.Now.Date.AddDays(-days);

        var recordsToDelete = await _context.BiometricRecords
            .Where(r => r.CompanyId == companyId && r.RecordDate < cutoffDate)
            .ToListAsync();

        if (recordsToDelete.Any())
        {
            _context.BiometricRecords.RemoveRange(recordsToDelete);
            await _context.SaveChangesAsync(CancellationToken.None);
        }
    }
}
