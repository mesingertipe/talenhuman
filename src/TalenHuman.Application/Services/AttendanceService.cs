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

    public async Task ConsolidateDailyAttendanceAsync(DateTime date, Guid companyId, ExecutionType executionType = ExecutionType.Manual)
    {
        // Use Unspecified kind for the "ProcessedDate" to prevent UTC shifts in DB mappings
        var day = DateTime.SpecifyKind(date.Date, DateTimeKind.Unspecified);
        var log = new SyncLog 
        { 
            StartTime = DateTime.UtcNow, 
            ExecutionType = executionType,
            CompanyId = companyId,
            Status = "Iniciado",
            ProcessedDate = day
        };

        int totalRawRecords = 0;
        string currentStep = "Iniciada recolección inicial. Buscando tiendas.";

        try 
        {
            _context.SyncLogs.Add(log);
            await _context.SaveChangesAsync(CancellationToken.None);

            // 1. Get all Stores for this company to check settings
        var stores = await _context.Stores
            .Where(s => s.CompanyId == companyId && s.IsActive)
            .ToListAsync();

        foreach (var store in stores)
        {
            currentStep = $"Calculando ventana operativa para la tienda: {store.Name}";
            // Define Operational Window for this store (e.g., 05:00 AM to 04:59 AM next day)
            TimeSpan.TryParse(store.OperationalDayStart ?? "05:00", out var startTime);
            var windowStart = day.Add(startTime);
            var windowEnd = windowStart.AddHours(24).AddMinutes(-1);

            currentStep = $"Buscando empleados en tienda: {store.Name}";
            // Get Employees for this store
            var employees = await _context.Employees
                .Where(e => e.StoreId == store.Id && e.IsActive)
                .ToListAsync();

            foreach (var employee in employees)
            {
                currentStep = $"[{store.Name}] Buscando turnos agendados en Shifts de {employee.IdentificationNumber}.";
                // Get Scheduled Shifts for this employee in this window
                var shifts = await _context.Shifts
                    .Where(s => s.EmployeeId == employee.Id && 
                                s.StartTime >= windowStart && 
                                s.StartTime <= windowEnd && 
                                !s.IsDescanso)
                    .OrderBy(s => s.StartTime)
                    .ToListAsync();

                currentStep = $"[{store.Name}] Limpiando marcaciones anteriores de {employee.FirstName} {employee.LastName} ({employee.IdentificationNumber}).";
                // Clear previous attendances for this operational window (Corrected for nullable ClockIn)
                // Clean up previous records for this day/employee to avoid duplicates or ghost data
                var existingAttendances = await _context.Attendances
                    .Where(a => a.EmployeeId == employee.Id && (
                        (a.ShiftId != null && shifts.Select(s => s.Id).Contains(a.ShiftId.Value)) ||
                        (a.ClockIn != null && a.ClockIn >= windowStart && a.ClockIn <= windowEnd) ||
                        (a.Shift != null && a.Shift.StartTime >= windowStart && a.Shift.StartTime <= windowEnd)
                    ))
                    .ToListAsync();
                _context.Attendances.RemoveRange(existingAttendances);

                // 2. Normalización de ID (Caso Josefina)
                var normalizedId = employee.IdentificationNumber.TrimStart('0');

                currentStep = $"[{store.Name}] Consultando DB BiometricRecords para empleado {employee.IdentificationNumber} (Normalizado: {normalizedId}).";
                // Get All Biometric Records for this employee in this window
                // Match normalized IDs to fix leading zero issues
                var rawRecords = await _context.BiometricRecords
                    .Where(r => r.CompanyId == companyId && 
                                r.RecordDate >= windowStart && 
                                r.RecordDate <= windowEnd)
                    .OrderBy(r => r.RecordDate)
                    .ToListAsync();

                // Client-side filtering to handle non-SQL compatible normalization in where clause
                rawRecords = rawRecords.Where(r => r.DeviceUser.TrimStart('0') == normalizedId).ToList();

                totalRawRecords += rawRecords.Count;

                currentStep = $"[{store.Name}] Filtrando rebotes biométricos de {employee.IdentificationNumber} ({rawRecords.Count} registros crudos).";
                // Apply Rebound Filter (Ignore marks within 5 minutes)
                var filteredRecords = FilterReboundRecords(rawRecords, 5);

                // V13.0 Logic: Global Operational Preference
                var opSetting = await _context.OperationalSettings.FirstOrDefaultAsync(os => os.CompanyId == companyId);
                var mode = opSetting?.AttendanceMode ?? (store.UseSequentialPairing ? AttendanceMode.Sequential : AttendanceMode.ShiftCentric);

                currentStep = $"[{store.Name}] Ejecutando lógica {mode} para {employee.IdentificationNumber}.";
                
                if (mode == AttendanceMode.MinMax)
                {
                    await ProcessMinMaxPairingAsync(employee, store, shifts, filteredRecords, companyId, opSetting);
                }
                else if (mode == AttendanceMode.Sequential)
                {
                    await ProcessSequentialPairingAsync(employee, store, shifts, filteredRecords, companyId, opSetting);
                }
                else
                {
                    await ProcessStandardPairingAsync(employee, store, shifts, filteredRecords, companyId, opSetting, windowEnd);
                }
                currentStep = $"[{store.Name}] Finalizando emparejamiento para {employee.FirstName} {employee.LastName}. Preparando guardado.";
            }
        }

        currentStep = "Escribiendo lotes finales de Attendance en DB (SaveChangesAsync).";
        await _context.SaveChangesAsync(CancellationToken.None);

        log.EndTime = DateTime.UtcNow;
        log.Status = "Exitoso";
        log.RecordsProcessed = totalRawRecords;
        
        currentStep = "Guardando el log de integración.";
        await _context.SaveChangesAsync(CancellationToken.None);
    }
    catch (Exception ex)
    {
        ((DbContext)_context).ChangeTracker.Clear();
        log.EndTime = DateTime.UtcNow;
        log.Status = "Error";
        
        // Limit error length just in case
        var fullError = $"[CAÍDA EN]: {currentStep} || ERROR: {(ex.InnerException?.Message ?? ex.Message)}";
        log.ErrorMessage = fullError.Length > 240 ? fullError.Substring(0, 237) + "..." : fullError;
        
        _context.SyncLogs.Update(log);
        await _context.SaveChangesAsync(CancellationToken.None);
        throw new ApplicationException(fullError, ex);
    }
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

    private async Task ProcessSequentialPairingAsync(Employee emp, Store store, List<Shift> shifts, List<BiometricRecord> records, Guid companyId, OperationalSetting? opSetting)
    {
        bool checkInEarlyInfinite = opSetting?.CheckInEarlyInfinite ?? true;
        int checkInEarlyTolerance = opSetting?.CheckInEarlyTolerance ?? 15;
        int checkInLateTolerance = opSetting?.CheckInLateTolerance ?? 15;
        int checkOutTolerance = opSetting?.CheckOutTolerance ?? 15;

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

            // 2. Associate with the closest shift (Prefer 4h window, else closest available in window)
            var matchedShift = shifts.FirstOrDefault(s => s.StartTime >= clockIn.AddHours(-4) && s.StartTime <= clockIn.AddHours(4));
            
            if (matchedShift == null && shifts.Any())
            {
                // FALLBACK (V65.1.32): Link to closest shift in same operational day to avoid "Ausente"
                matchedShift = shifts.OrderBy(s => Math.Abs((s.StartTime - clockIn).TotalMinutes)).First();
                Console.WriteLine($"⚠️ [FCM SW] Flex-Link: {clockIn} linked to shift {matchedShift.StartTime} (outside 4h window)");
            }
            
            DateTime? refStart = matchedShift?.StartTime;
            DateTime? refEnd = matchedShift?.EndTime;

            // 3. FALLBACK: Use store default schedule if no shift is matched
            if (matchedShift == null)
            {
                TimeSpan.TryParse(store.DefaultStartTime ?? "08:00", out var defStart);
                TimeSpan.TryParse(store.DefaultEndTime ?? "17:00", out var defEnd);
                
                var baseDate = DateTime.SpecifyKind(clockIn.Date, DateTimeKind.Utc);
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
                if (matchedShift.Id != Guid.Empty)
                {
                    attendance.Shift = matchedShift;
                }
                
                shifts.Remove(matchedShift); // Consume shift
            }

            // 4. Determine status based on reference (Shift or Store Default)
            if (refStart.HasValue && refEnd.HasValue)
            {
                if (clockOut.HasValue)
                {
                    bool isEarlyCheckIn = clockIn < refStart.Value;
                    var diffStart = Math.Abs((clockIn - refStart.Value).TotalMinutes);
                    var diffEnd = Math.Abs((clockOut.Value - refEnd.Value).TotalMinutes);
                    
                    bool isCheckInCorrect = isEarlyCheckIn 
                        ? (checkInEarlyInfinite || diffStart <= checkInEarlyTolerance)
                        : (diffStart <= checkInLateTolerance);

                    bool isCheckOutCorrect = diffEnd <= checkOutTolerance;

                    if (isCheckInCorrect && isCheckOutCorrect)
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
            if (remainingShift.Id != Guid.Empty)
            {
                _context.Attendances.Add(new Attendance
                {
                    EmployeeId = emp.Id,
                    StoreId = store.Id,
                    CompanyId = companyId,
                    Shift = remainingShift,
                    ClockIn = null,
                    Status = AttendanceStatus.SinMarcacion,
                    StatusObservation = "Sin registros biométricos."
                });
            }
        }
    }

    private async Task ProcessMinMaxPairingAsync(Employee emp, Store store, List<Shift> shifts, List<BiometricRecord> records, Guid companyId, OperationalSetting? opSetting)
    {
        bool checkInEarlyInfinite = opSetting?.CheckInEarlyInfinite ?? true;
        int checkInEarlyTolerance = opSetting?.CheckInEarlyTolerance ?? 15;
        int checkInLateTolerance = opSetting?.CheckInLateTolerance ?? 15;
        int checkOutTolerance = opSetting?.CheckOutTolerance ?? 15;

        if (records.Count == 0)
        {
            // Handle shifts with no markings (Mark all as Absent)
            foreach (var s in shifts)
            {
                _context.Attendances.Add(new Attendance
                {
                    EmployeeId = emp.Id,
                    StoreId = store.Id,
                    CompanyId = companyId,
                    Shift = s,
                    ClockIn = null,
                    Status = AttendanceStatus.SinMarcacion,
                    StatusObservation = "Sin registros biométricos."
                });
            }
            return;
        }

        // ABSOLUTE MIN-MAX LOGIC
        var firstRecord = records.OrderBy(r => r.RecordDate).First();
        var lastRecord = records.OrderBy(r => r.RecordDate).Last();

        var attendance = new Attendance
        {
            EmployeeId = emp.Id,
            StoreId = store.Id,
            CompanyId = companyId,
            ClockIn = firstRecord.RecordDate,
            ClockOut = (firstRecord.Id != lastRecord.Id) ? lastRecord.RecordDate : null,
            StatusObservation = "Consolidación Min-Max Activa. "
        };

        // Link with the main shift of the day (usually the first one)
        var mainShift = shifts.OrderBy(s => s.StartTime).FirstOrDefault();
        if (mainShift != null)
        {
            attendance.Shift = mainShift;
            bool isEarlyCheckIn = attendance.ClockIn.Value < mainShift.StartTime;
            var diffStart = Math.Abs((attendance.ClockIn.Value - mainShift.StartTime).TotalMinutes);
            
            if (attendance.ClockOut.HasValue)
            {
                var diffEnd = Math.Abs((attendance.ClockOut.Value - mainShift.EndTime).TotalMinutes);

                bool isCheckInCorrect = isEarlyCheckIn 
                    ? (checkInEarlyInfinite || diffStart <= checkInEarlyTolerance)
                    : (diffStart <= checkInLateTolerance);

                bool isCheckOutCorrect = diffEnd <= checkOutTolerance;

                attendance.Status = (isCheckInCorrect && isCheckOutCorrect) ? AttendanceStatus.Correcto : AttendanceStatus.Desfasado;
                if (attendance.Status == AttendanceStatus.Desfasado)
                    attendance.StatusObservation += $"Desfase E:{diffStart:F0}m, S:{diffEnd:F0}m.";
            }
            else
            {
                attendance.Status = AttendanceStatus.MarcacionErrada;
                attendance.StatusObservation += "Falta marcación de salida.";
            }
        }
        else
        {
            attendance.Status = attendance.ClockOut.HasValue ? AttendanceStatus.Correcto : AttendanceStatus.MarcacionErrada;
            attendance.StatusObservation += "Sin turno agendado.";
        }

        _context.Attendances.Add(attendance);
    }

    private async Task ProcessStandardPairingAsync(Employee emp, Store store, List<Shift> shifts, List<BiometricRecord> records, Guid companyId, OperationalSetting? opSetting, DateTime windowEnd)
    {
        bool checkInEarlyInfinite = opSetting?.CheckInEarlyInfinite ?? true;
        int checkInEarlyTolerance = opSetting?.CheckInEarlyTolerance ?? 15;
        int checkInLateTolerance = opSetting?.CheckInLateTolerance ?? 15;
        int checkOutTolerance = opSetting?.CheckOutTolerance ?? 15;

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
                EmployeeId = emp.Id,
                StoreId = store.Id,
                CompanyId = companyId,
                StartTime = DateTime.SpecifyKind(storeStart, DateTimeKind.Utc), 
                EndTime = DateTime.SpecifyKind(storeEnd, DateTimeKind.Utc),
                Observation = "Generado automáticamente por horario de sede.",
                Status = ShiftStatus.Scheduled
            });
        }

        for (int i = 0; i < shifts.Count; i++)
        {
            var shift = shifts[i];
            var attendance = new Attendance
            {
                EmployeeId = emp.Id,
                StoreId = store.Id,
                CompanyId = companyId,
                Shift = (shift.Id != Guid.Empty) ? shift : null,
                ClockIn = null
            };

            var nextShift = (i + 1 < shifts.Count) ? shifts[i + 1] : null;
            var maxAllowedTime = nextShift != null
                ? (nextShift.StartTime < shift.EndTime.AddHours(2) ? nextShift.StartTime : shift.EndTime.AddHours(2))
                : windowEnd;

            var shiftRecords = availableRecords
                .Where(r => r.RecordDate >= shift.StartTime.AddHours(-2) && 
                            r.RecordDate <= maxAllowedTime)
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

                bool isEarlyCheckIn = first.RecordDate < shift.StartTime;
                var diffStart = Math.Abs((first.RecordDate - shift.StartTime).TotalMinutes);
                var diffEnd = Math.Abs((last.RecordDate - shift.EndTime).TotalMinutes);

                bool isCheckInCorrect = isEarlyCheckIn 
                    ? (checkInEarlyInfinite || diffStart <= checkInEarlyTolerance)
                    : (diffStart <= checkInLateTolerance);

                bool isCheckOutCorrect = diffEnd <= checkOutTolerance;

                if (isCheckInCorrect && isCheckOutCorrect)
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
        // Get retention setting (Prefer company-specific prefixed key)
        var prefixedKey = $"{companyId}_BiometricRetentionDays";
        var retentionSetting = await _context.SystemSettings
            .FirstOrDefaultAsync(s => s.Key == prefixedKey)
            ?? await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "BiometricRetentionDays");
        
        int days = 7; // Default
        if (retentionSetting != null && int.TryParse(retentionSetting.Value, out int customDays))
        {
            days = customDays;
        }

        // Cutoff calculation (Relative to Mexico/Bogota time)
        var now = ColombiaTime.Now;
        var cutoffDate = DateTime.SpecifyKind(now.Date.AddDays(-days), DateTimeKind.Utc);
        
        var recordsToDelete = await _context.BiometricRecords
            .Where(r => r.CompanyId == companyId && r.RecordDate < cutoffDate)
            .ToListAsync();

        if (recordsToDelete.Count > 0)
        {
            _context.BiometricRecords.RemoveRange(recordsToDelete);
            await _context.SaveChangesAsync(CancellationToken.None);
        }
    }
}
