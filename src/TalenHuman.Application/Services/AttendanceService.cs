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
        
        // 1. Get all Stores for this company to check settings
        var stores = await _context.Stores
            .Where(s => s.CompanyId == companyId && s.IsActive)
            .ToListAsync();

        foreach (var store in stores)
        {
            // Define Operational Window for this store (e.g., 05:00 AM to 04:59 AM next day)
            TimeSpan.TryParse(store.OperationalDayStart ?? "05:00", out var startTime);
            var windowStart = day.Add(startTime);
            var windowEnd = windowStart.AddHours(24).AddMinutes(-1);

            // Get Employees for this store
            var employees = await _context.Employees
                .Where(e => e.StoreId == store.Id && e.IsActive)
                .ToListAsync();

            foreach (var employee in employees)
            {
                // Clear previous attendances for this operational window
                var existingAttendances = await _context.Attendances
                    .Where(a => a.EmployeeId == employee.Id && a.ClockIn >= windowStart && a.ClockIn <= windowEnd)
                    .ToListAsync();
                _context.Attendances.RemoveRange(existingAttendances);

                // Get All Biometric Records for this employee in this window
                var rawRecords = await _context.BiometricRecords
                    .Where(r => r.CompanyId == companyId && 
                                r.DeviceUser == employee.IdentificationNumber &&
                                r.RecordDate >= windowStart && 
                                r.RecordDate <= windowEnd)
                    .OrderBy(r => r.RecordDate)
                    .ToListAsync();

                // Apply Rebound Filter (Ignore marks within 5 minutes)
                var filteredRecords = FilterReboundRecords(rawRecords, 5);

                // Get Scheduled Shifts for this employee in this window
                var shifts = await _context.Shifts
                    .Where(s => s.EmployeeId == employee.Id && 
                                s.StartTime >= windowStart && 
                                s.StartTime <= windowEnd && 
                                !s.IsDescanso)
                    .OrderBy(s => s.StartTime)
                    .ToListAsync();

                if (store.UseSequentialPairing)
                {
                    // MODE: SEQUENTIAL PAIRING (Airport Style)
                    await ProcessSequentialPairingAsync(employee, store, shifts, filteredRecords, companyId);
                }
                else
                {
                    // MODE: SHIFT-CENTRIC (Standard Style)
                    await ProcessStandardPairingAsync(employee, store, shifts, filteredRecords, companyId);
                }
            }
        }

        await _context.SaveChangesAsync(CancellationToken.None);
    }

    private List<BiometricRecord> FilterReboundRecords(List<BiometricRecord> records, int minutesThreshold)
    {
        if (records.Count <= 1) return records;
        
        var filtered = new List<BiometricRecord> { records[0] };
        for (int i = 1; i < records.Count; i++)
        {
            if ((records[i].RecordDate - filtered.Last().RecordDate).TotalMinutes >= minutesThreshold)
            {
                filtered.Add(records[i]);
            }
        }
        return filtered;
    }

    private async Task ProcessSequentialPairingAsync(Employee emp, Store store, List<Shift> shifts, List<BiometricRecord> records, Guid companyId)
    {
        // 1. Generate Pairs sequentially
        for (int i = 0; i < records.Count; i += 2)
        {
            var clockIn = records[i].RecordDate;
            DateTime? clockOut = (i + 1 < records.Count) ? records[i + 1].RecordDate : null;

            var attendance = new Attendance
                {
                    EmployeeId = emp.Id,
                    StoreId = store.Id,
                    CompanyId = companyId,
                    ClockIn = clockIn,
                    ClockOut = clockOut
                };

            // 2. Associate with the closest shift
            var matchedShift = shifts.FirstOrDefault(s => s.StartTime >= clockIn.AddHours(-4) && s.StartTime <= clockIn.AddHours(4));
            
            DateTime? refStart = matchedShift?.StartTime;
            DateTime? refEnd = matchedShift?.EndTime;

            // 3. FALLBACK: Use store default schedule if no shift is matched
            if (matchedShift == null)
            {
                TimeSpan.TryParse(store.DefaultStartTime ?? "08:00", out var defStart);
                TimeSpan.TryParse(store.DefaultEndTime ?? "17:00", out var defEnd);
                
                var baseDate = clockIn.Date;
                var storeStart = baseDate.Add(defStart);
                var storeEnd = baseDate.Add(defEnd);
                if (storeEnd <= storeStart) storeEnd = storeEnd.AddDays(1); // Handle overnight

                // If clockIn is within 4 hours of store start, we use the store default
                if (Math.Abs((clockIn - storeStart).TotalHours) <= 4)
                {
                    refStart = storeStart;
                    refEnd = storeEnd;
                    attendance.StatusObservation = "(Horario de Sede) ";
                }
            }
            else
            {
                attendance.ShiftId = matchedShift.Id;
                shifts.Remove(matchedShift); // Consume shift
            }

            // 4. Determine status based on reference (Shift or Store Default)
            if (refStart.HasValue && refEnd.HasValue)
            {
                if (clockOut.HasValue)
                {
                    var diffStart = Math.Abs((clockIn - refStart.Value).TotalMinutes);
                    var diffEnd = Math.Abs((clockOut.Value - refEnd.Value).TotalMinutes);
                    
                    if (diffStart <= 15 && diffEnd <= 15)
                    {
                        attendance.Status = AttendanceStatus.Correcto;
                        attendance.StatusObservation += "Cruce correcto.";
                    }
                    else
                    {
                        attendance.Status = AttendanceStatus.Desfasado;
                        attendance.StatusObservation += $"Desfase: E {diffStart:F0}m, S {diffEnd:F0}m.";
                    }
                }
                else
                {
                    attendance.Status = AttendanceStatus.MarcacionErrada;
                    attendance.StatusObservation += "Falta marcador de salida.";
                }
            }
            else
            {
                attendance.Status = clockOut.HasValue ? AttendanceStatus.Correcto : AttendanceStatus.MarcacionErrada;
                attendance.StatusObservation = clockOut.HasValue ? "Marcación extra (Sin turno/horario)." : "Marcación única (Sin turno/horario).";
            }

            _context.Attendances.Add(attendance);
        }

        // Handle scheduled shifts with NO markings
        foreach (var remainingShift in shifts)
        {
            _context.Attendances.Add(new Attendance
            {
                EmployeeId = emp.Id,
                StoreId = store.Id,
                CompanyId = companyId,
                ShiftId = remainingShift.Id,
                ClockIn = remainingShift.StartTime,
                Status = AttendanceStatus.SinMarcacion,
                StatusObservation = "Sin registros biométricos."
            });
        }
    }

    private async Task ProcessStandardPairingAsync(Employee emp, Store store, List<Shift> shifts, List<BiometricRecord> records, Guid companyId)
    {
        var availableRecords = new List<BiometricRecord>(records);

        // If no shifts are assigned, but we have records, try using store defaults
        if (shifts.Count == 0 && records.Count > 0)
        {
            TimeSpan.TryParse(store.DefaultStartTime ?? "08:00", out var defStart);
            TimeSpan.TryParse(store.DefaultEndTime ?? "17:00", out var defEnd);
            
            // Create a virtual shift based on store default for the first record's day
            var baseDate = records[0].RecordDate.Date;
            var storeStart = baseDate.Add(defStart);
            var storeEnd = baseDate.Add(defEnd);
            if (storeEnd <= storeStart) storeEnd = storeEnd.AddDays(1);

            shifts.Add(new Shift 
            { 
                StartTime = storeStart, 
                EndTime = storeEnd,
                Observation = "Generado automáticamente por horario de sede."
            });
        }

        foreach (var shift in shifts)
        {
            var attendance = new Attendance
            {
                EmployeeId = emp.Id,
                StoreId = store.Id,
                CompanyId = companyId,
                ShiftId = shift.Id != Guid.Empty ? shift.Id : (Guid?)null,
                ClockIn = shift.StartTime
            };

            var shiftRecords = availableRecords
                .Where(r => r.RecordDate >= shift.StartTime.AddHours(-2) && 
                            r.RecordDate <= shift.EndTime.AddHours(2))
                .OrderBy(r => r.RecordDate)
                .ToList();

            if (shiftRecords.Count == 0)
            {
                attendance.Status = AttendanceStatus.SinMarcacion;
                attendance.StatusObservation = "Sin registros biométricos.";
            }
            else if (shiftRecords.Count == 1)
            {
                attendance.ClockIn = shiftRecords[0].RecordDate;
                attendance.Status = AttendanceStatus.MarcacionErrada;
                attendance.StatusObservation = "Par incompleto.";
                availableRecords.Remove(shiftRecords[0]);
            }
            else
            {
                var first = shiftRecords.First();
                var last = shiftRecords.Last();
                attendance.ClockIn = first.RecordDate;
                attendance.ClockOut = last.RecordDate;

                var diffStart = Math.Abs((first.RecordDate - shift.StartTime).TotalMinutes);
                var diffEnd = Math.Abs((last.RecordDate - shift.EndTime).TotalMinutes);

                if (diffStart <= 15 && diffEnd <= 15)
                {
                    attendance.Status = AttendanceStatus.Correcto;
                }
                else
                {
                    attendance.Status = AttendanceStatus.Desfasado;
                    attendance.StatusObservation = $"Desfase: E {diffStart:F0}m, S {diffEnd:F0}m.";
                }

                foreach (var consumed in shiftRecords) availableRecords.Remove(consumed);
            }

            _context.Attendances.Add(attendance);
        }
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
