using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;

namespace TalenHuman.Application.Services;

public class AttendanceReportService
{
    private readonly IApplicationDbContext _context;
    private readonly NotificationService _notificationService;

    public AttendanceReportService(IApplicationDbContext context, NotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task SendAutomaticDailyReportsAsync(Guid companyId, DateTime date)
    {
        // 1. Fetch Company Operational Settings to determine routing logic
        var settings = await _context.OperationalSettings.FirstOrDefaultAsync(s => s.CompanyId == companyId);
        var approvalMode = settings?.ShiftApprovalMode ?? ShiftApprovalMode.HR;

        // 2. Fetch target administrative and manager roles
        var targetRoles = await _context.Roles
            .Where(r => r.Name == "Admin" || r.Name == "SuperAdmin" || r.Name == "RH" || r.Name == "Gerente" || r.Name == "Distrital")
            .ToListAsync();

        var targetRoleIds = targetRoles.Select(r => r.Id).ToList();

        // 3. Query User-Role mappings
        var userRolesMapping = await _context.Set<IdentityUserRole<Guid>>()
            .Where(ur => targetRoleIds.Contains(ur.RoleId))
            .ToListAsync();

        var adminOrRhUserIds = userRolesMapping
            .Where(ur => targetRoles.Any(r => (r.Name == "Admin" || r.Name == "RH") && r.Id == ur.RoleId))
            .Select(ur => ur.UserId)
            .ToHashSet();

        var gerenteUserIds = userRolesMapping
            .Where(ur => targetRoles.Any(r => r.Name == "Gerente" && r.Id == ur.RoleId))
            .Select(ur => ur.UserId)
            .ToHashSet();

        var superAdminUserIds = userRolesMapping
            .Where(ur => targetRoles.Any(r => r.Name == "SuperAdmin" && r.Id == ur.RoleId))
            .Select(ur => ur.UserId)
            .ToHashSet();

        // 4. Fetch all potential administrative/managerial recipients (excluding SuperAdmins)
        var users = await _context.Users
            .Include(u => u.Employee)
                .ThenInclude(e => e.Profile)
            .Where(u => u.CompanyId == companyId && u.IsActive && !superAdminUserIds.Contains(u.Id))
            .Where(u => 
                adminOrRhUserIds.Contains(u.Id) ||
                gerenteUserIds.Contains(u.Id) ||
                u.DistrictId != null ||
                _context.SupervisorStores.Any(ss => ss.UserId == u.Id) ||
                (u.Employee != null && u.Employee.Profile != null && u.Employee.Profile.Name.ToUpper().Contains("RH")) ||
                (u.Email != null && (u.Email.ToLower().Contains("admin") || u.Email.ToLower().Contains("gerencia")))
            )
            .ToListAsync();

        var culture = new System.Globalization.CultureInfo("es-ES");

        foreach (var user in users)
        {
            byte[]? pdfContent = null;
            string subject = $"Reporte de Asistencia TalenHuman - {date:dd/MM/yyyy}";
            bool isWeekly = false;

            // 1. Identify District Level -> Daily District Report
            if (user.DistrictId != null)
            {
                pdfContent = await GeneratePdfReportAsync(companyId, date, districtId: user.DistrictId);
            }
            // 2. Identify Store Level (Gerente) -> Weekly Accumulated Report
            else
            {
                var managedStores = await _context.SupervisorStores
                    .Where(ss => ss.UserId == user.Id)
                    .Select(ss => ss.StoreId)
                    .ToListAsync();

                if (managedStores.Any())
                {
                    isWeekly = true;
                    // Calculate week start (Monday) for the range [monday, date]
                    int diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
                    DateTime monday = date.AddDays(-1 * diff).Date;
                    
                    string dayNameStr = culture.TextInfo.ToTitleCase(date.ToString("dddd", culture));
                    subject = $"Reporte de Asistencia Semanal TalenHuman - Al {dayNameStr} {date:dd/MM/yyyy}";
                    pdfContent = await GenerateWeeklyPdfReportAsync(companyId, date, managedStores);
                }
                else
                {
                    // 3. Fallback only for Global Admins -> Daily Global Report
                    pdfContent = await GeneratePdfReportAsync(companyId, date);
                }
            }

            if (pdfContent != null)
            {
                string message = isWeekly
                    ? $"Hola {user.FullName}, adjunto enviamos el consolidado semanal de asistencia acumulado de lunes a {date.ToString("dddd", culture).ToLower()} {date:dd/MM/yyyy}.<br/><br/>Saludos,<br/>Equipo TalenHuman."
                    : $"Hola {user.FullName}, adjunto enviamos el consolidado de asistencia correspondiente al día {date:dd/MM/yyyy}.<br/><br/>Saludos,<br/>Equipo TalenHuman.";

                string filename = isWeekly
                    ? $"Asistencia_Semanal_{date:yyyyMMdd}.pdf"
                    : $"Asistencia_{date:yyyyMMdd}.pdf";

                await _notificationService.SendNotificationAsync(new NotificationRequest
                {
                    To = user.Email!,
                    Subject = subject,
                    Message = message,
                    Attachments = new List<AttachmentDto>
                    {
                        new AttachmentDto { Filename = filename, Content = pdfContent, ContentType = "application/pdf" }
                    }
                });
            }
        }
    }

    public async Task<byte[]> GeneratePdfReportAsync(Guid companyId, DateTime date, Guid? districtId = null, List<Guid>? storeIds = null)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        // 1. Get Master List of Active Stores for this context
        var storeQuery = _context.Stores
            .Where(s => s.CompanyId == companyId && s.IsActive);

        if (districtId.HasValue)
        {
            storeQuery = storeQuery.Where(s => s.DistrictId == districtId.Value);
        }
        else if (storeIds != null && storeIds.Any())
        {
            storeQuery = storeQuery.Where(s => storeIds.Contains(s.Id));
        }

        var allContextStores = await storeQuery.ToListAsync();

        // 2. Fetch Master Data for the day: Shifts and Attendances (Only Active Employees)
        var shiftQuery = _context.Shifts
            .Include(s => s.Store)
            .Include(s => s.Employee)
            .Where(s => s.CompanyId == companyId && s.StartTime.Date == date.Date && s.Employee.IsActive && !s.IsDescanso);

        var attendanceQuery = _context.Attendances
            .Include(a => a.Store)
            .Include(a => a.Employee)
            .Include(a => a.Shift)
            .Where(a => a.CompanyId == companyId && a.Employee.IsActive && (
                (a.ClockIn.HasValue && a.ClockIn.Value.Date == date.Date) ||
                (a.Shift != null && a.Shift.StartTime.Date == date.Date)
            ));

        if (districtId.HasValue)
        {
            shiftQuery = shiftQuery.Where(s => s.Store.DistrictId == districtId.Value);
            attendanceQuery = attendanceQuery.Where(a => a.Store.DistrictId == districtId.Value);
        }
        else if (storeIds != null && storeIds.Any())
        {
            shiftQuery = shiftQuery.Where(s => storeIds.Contains(s.StoreId));
            attendanceQuery = attendanceQuery.Where(a => storeIds.Contains(a.StoreId));
        }

        var allShifts = await shiftQuery.ToListAsync();
        var allAttendances = await attendanceQuery.ToListAsync();

        var shiftGroups = allShifts.GroupBy(s => s.StoreId).ToDictionary(g => g.Key, g => g.ToList());
        var attendanceGroups = allAttendances.GroupBy(a => a.StoreId).ToDictionary(g => g.Key, g => g.ToList());

        // 2b. Fetch Weekly Failures (MarcacionErrada and SinMarcacion) from Monday to date
        int diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
        DateTime startDate = date.AddDays(-1 * diff).Date;

        var weeklyFailuresQuery = _context.Attendances
            .Include(a => a.Store)
            .Include(a => a.Employee)
            .Include(a => a.Shift)
            .Where(a => a.CompanyId == companyId && a.Employee.IsActive && (
                a.Status == AttendanceStatus.MarcacionErrada || a.Status == AttendanceStatus.SinMarcacion
            ) && (
                (a.ClockIn.HasValue && a.ClockIn.Value.Date >= startDate && a.ClockIn.Value.Date <= date.Date) ||
                (a.Shift != null && a.Shift.StartTime.Date >= startDate && a.Shift.StartTime.Date <= date.Date)
            ));

        if (districtId.HasValue)
        {
            weeklyFailuresQuery = weeklyFailuresQuery.Where(a => a.Store.DistrictId == districtId.Value);
        }
        else if (storeIds != null && storeIds.Any())
        {
            weeklyFailuresQuery = weeklyFailuresQuery.Where(a => storeIds.Contains(a.StoreId));
        }

        var weeklyFailures = await weeklyFailuresQuery.ToListAsync();
        var sortedFailures = weeklyFailures
            .OrderByDescending(a => a.ClockIn?.Date ?? a.Shift?.StartTime.Date ?? DateTime.MinValue)
            .ThenBy(a => a.Store.Name)
            .ThenBy(a => a.Employee.FirstName)
            .ThenBy(a => a.Employee.LastName)
            .ToList();

        // 3. Fetch Employee counts per store for "Plantilla"
        var employeeCounts = await _context.Employees
            .Where(e => e.CompanyId == companyId && e.IsActive)
            .GroupBy(e => e.StoreId)
            .Select(g => new { StoreId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.StoreId, x => x.Count);

        // 4. Project stats using ALL context stores (The 7 Request Rules)
        var stats = allContextStores.Select(s => {
            var storeShifts = shiftGroups.ContainsKey(s.Id) ? shiftGroups[s.Id] : new List<Shift>();
            var storeAttendances = attendanceGroups.ContainsKey(s.Id) ? attendanceGroups[s.Id] : new List<Attendance>();
            var empCount = employeeCounts.ContainsKey(s.Id) ? employeeCounts[s.Id] : 0;

            // Link Attendances to Shifts found for this store (V65.1.32 Logic)
            return new {
                Store = s.Name,
                Plantilla = empCount,
                TotalTurnos = storeShifts.Count,
                Correcto = storeAttendances.Count(a => a.Status == AttendanceStatus.Correcto),
                Errada = storeAttendances.Count(a => a.Status == AttendanceStatus.MarcacionErrada),
                Desfase = storeAttendances.Count(a => a.Status == AttendanceStatus.Desfasado),
                Ausente = storeAttendances.Count(a => a.Status == AttendanceStatus.SinMarcacion),
                Marcaciones = storeAttendances.Count(a => a.Status != AttendanceStatus.SinMarcacion)
            };
        }).OrderBy(s => s.Store).ToList();


        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Arial));

                page.Header().Row(row =>
                {
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text("Talenhuman").FontSize(20).SemiBold().FontColor(Colors.Indigo.Medium);
                        col.Item().Text("Reporte Consolidado de Asistencia").FontSize(12).FontColor(Colors.Grey.Medium);
                    });

                    row.RelativeItem().AlignRight().Column(col =>
                    {
                        col.Item().Text($"Fecha: {date:dd/MM/yyyy}").FontSize(10);
                        col.Item().Text($"Generado: {DateTime.Now:HH:mm}").FontSize(10);
                    });
                });

                page.Content().PaddingVertical(20).Column(col =>
                {
                    col.Item().PaddingBottom(10).Text("RESUMEN OPERATIVO POR SEDE").FontSize(14).SemiBold().FontColor(Colors.Indigo.Darken2);

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(3); // Sede
                            columns.RelativeColumn(1); // Plantilla
                            columns.RelativeColumn(1); // Marcaciones
                            columns.RelativeColumn(1); // Turnos
                            columns.RelativeColumn(1); // Correcto
                            columns.RelativeColumn(1); // Errada
                            columns.RelativeColumn(1); // Desfase
                            columns.RelativeColumn(1); // Ausente
                        });

                        table.Header(header =>
                        {
                            header.Cell().Element(CellStyle).Text("Sede");
                            header.Cell().Element(CellStyle).AlignCenter().Text("Plantilla");
                            header.Cell().Element(CellStyle).AlignCenter().Text("Marcaciones");
                            header.Cell().Element(CellStyle).AlignCenter().Text("Turnos");
                            header.Cell().Element(CellStyle).AlignCenter().Text("Correcto");
                            header.Cell().Element(CellStyle).AlignCenter().Text("Errada");
                            header.Cell().Element(CellStyle).AlignCenter().Text("Desfase");
                            header.Cell().Element(CellStyle).AlignCenter().Text("Ausente");

                            static IContainer CellStyle(IContainer container) => container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Black);
                        });

                        foreach (var item in stats)
                        {
                            table.Cell().Element(Padding).Text(item.Store);
                            table.Cell().Element(Padding).AlignCenter().Text(item.Plantilla.ToString());
                            table.Cell().Element(Padding).AlignCenter().Text($"{item.Marcaciones}").SemiBold();
                            table.Cell().Element(Padding).AlignCenter().Text(item.TotalTurnos.ToString());
                            table.Cell().Element(Padding).AlignCenter().Text($"{item.Correcto}").FontColor(Colors.Green.Darken2);
                            table.Cell().Element(Padding).AlignCenter().Text($"{item.Errada}").FontColor(Colors.Amber.Darken2);
                            table.Cell().Element(Padding).AlignCenter().Text($"{item.Desfase}").FontColor(Colors.Blue.Darken2);
                            table.Cell().Element(Padding).AlignCenter().Text($"{item.Ausente}").FontColor(Colors.Red.Darken2);

                            static IContainer Padding(IContainer container) => container.PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten3);
                        }
                    });



                    if (!allAttendances.Any())
                    {
                        col.Item().PaddingTop(20).AlignCenter().Text("No se encontraron registros de marcación para la fecha seleccionada.").Italic().FontColor(Colors.Grey.Medium);
                    }

                    RenderWeeklyFailuresTable(col, sortedFailures, date);
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Página ");
                    x.CurrentPageNumber();
                    x.Span(" de ");
                    x.TotalPages();
                });
            });
        });

        return document.GeneratePdf();
    }

    public async Task<byte[]> GenerateWeeklyPdfReportAsync(Guid companyId, DateTime endDate, List<Guid> storeIds)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        // 1. Calculate Monday of the week containing endDate
        int diff = (7 + (endDate.DayOfWeek - DayOfWeek.Monday)) % 7;
        DateTime startDate = endDate.AddDays(-1 * diff).Date;

        // 2. Get Master List of Supervised Active Stores
        var allContextStores = await _context.Stores
            .Where(s => s.CompanyId == companyId && s.IsActive && storeIds.Contains(s.Id))
            .ToListAsync();

        var storeNamesStr = string.Join(", ", allContextStores.Select(s => s.Name));

        // 3. Fetch employee counts per store for Plantilla
        var employeeCounts = await _context.Employees
            .Where(e => e.CompanyId == companyId && e.IsActive && storeIds.Contains(e.StoreId))
            .GroupBy(e => e.StoreId)
            .Select(g => new { StoreId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.StoreId, x => x.Count);

        var totalPlantilla = allContextStores.Sum(s => employeeCounts.GetValueOrDefault(s.Id, 0));

        // 4. Fetch Master Data for the range [startDate, endDate] (Only Active Employees)
        var allShifts = await _context.Shifts
            .Include(s => s.Store)
            .Include(s => s.Employee)
            .Where(s => s.CompanyId == companyId 
                     && s.StartTime.Date >= startDate.Date 
                     && s.StartTime.Date <= endDate.Date 
                     && s.Employee.IsActive 
                     && !s.IsDescanso
                     && storeIds.Contains(s.StoreId))
            .ToListAsync();

        var allAttendances = await _context.Attendances
            .Include(a => a.Store)
            .Include(a => a.Employee)
            .Include(a => a.Shift)
            .Where(a => a.CompanyId == companyId 
                     && a.Employee.IsActive 
                     && storeIds.Contains(a.StoreId) 
                     && (
                         (a.ClockIn.HasValue && a.ClockIn.Value.Date >= startDate.Date && a.ClockIn.Value.Date <= endDate.Date) ||
                         (a.Shift != null && a.Shift.StartTime.Date >= startDate.Date && a.Shift.StartTime.Date <= endDate.Date)
                     ))
            .ToListAsync();

        // 4b. Filter in-memory for Weekly Failures (MarcacionErrada and SinMarcacion) for the weekly report
        var weeklyFailures = allAttendances
            .Where(a => a.Status == AttendanceStatus.MarcacionErrada || a.Status == AttendanceStatus.SinMarcacion)
            .OrderByDescending(a => a.ClockIn?.Date ?? a.Shift?.StartTime.Date ?? DateTime.MinValue)
            .ThenBy(a => a.Store.Name)
            .ThenBy(a => a.Employee.FirstName)
            .ThenBy(a => a.Employee.LastName)
            .ToList();

        // 5. Group data by date
        var shiftsByDay = allShifts
            .GroupBy(s => s.StartTime.Date)
            .ToDictionary(g => g.Key, g => g.ToList());

        var attendancesByDay = allAttendances
            .GroupBy(a => a.ClockIn?.Date ?? a.Shift?.StartTime.Date ?? DateTime.MinValue)
            .ToDictionary(g => g.Key, g => g.ToList());

        // 6. Project weekly statistics (Option A: Combined summary per day)
        var statsList = new List<WeeklyDayStats>();
        var culture = new System.Globalization.CultureInfo("es-ES");

        for (var d = endDate.Date; d >= startDate.Date; d = d.AddDays(-1))
        {
            var dayShifts = shiftsByDay.GetValueOrDefault(d, new List<Shift>());
            var dayAttendances = attendancesByDay.GetValueOrDefault(d, new List<Attendance>());

            statsList.Add(new WeeklyDayStats
            {
                Date = d,
                DayName = culture.TextInfo.ToTitleCase(d.ToString("dddd", culture)),
                Plantilla = totalPlantilla,
                TotalTurnos = dayShifts.Count,
                Correcto = dayAttendances.Count(a => a.Status == AttendanceStatus.Correcto),
                Errada = dayAttendances.Count(a => a.Status == AttendanceStatus.MarcacionErrada),
                Desfase = dayAttendances.Count(a => a.Status == AttendanceStatus.Desfasado),
                Ausente = dayAttendances.Count(a => a.Status == AttendanceStatus.SinMarcacion),
                Marcaciones = dayAttendances.Count(a => a.Status != AttendanceStatus.SinMarcacion)
            });
        }

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Arial));

                page.Header().Row(row =>
                {
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text("Talenhuman").FontSize(20).SemiBold().FontColor(Colors.Indigo.Medium);
                        col.Item().Text("Consolidado Semanal de Asistencia").FontSize(12).FontColor(Colors.Grey.Medium);
                        col.Item().Text($"Sedes: {storeNamesStr}").FontSize(9).Italic().FontColor(Colors.Grey.Darken1);
                    });

                    row.RelativeItem().AlignRight().Column(col =>
                    {
                        col.Item().Text($"Período: {startDate:dd/MM/yyyy} al {endDate:dd/MM/yyyy}").FontSize(10).SemiBold();
                        col.Item().Text($"Generado: {DateTime.Now:HH:mm}").FontSize(10);
                    });
                });

                page.Content().PaddingVertical(20).Column(col =>
                {
                    col.Item().PaddingBottom(10).Text("RESUMEN DIARIO ACUMULADO").FontSize(14).SemiBold().FontColor(Colors.Indigo.Darken2);

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(3); // Día / Fecha
                            columns.RelativeColumn(1); // Plantilla
                            columns.RelativeColumn(1); // Marcaciones
                            columns.RelativeColumn(1); // Turnos
                            columns.RelativeColumn(1); // Correcto
                            columns.RelativeColumn(1); // Errada
                            columns.RelativeColumn(1); // Desfase
                            columns.RelativeColumn(1); // Ausente
                        });

                        table.Header(header =>
                        {
                            header.Cell().Element(HeaderStyle).Text("Día / Fecha");
                            header.Cell().Element(HeaderStyle).AlignCenter().Text("Plantilla");
                            header.Cell().Element(HeaderStyle).AlignCenter().Text("Marcaciones");
                            header.Cell().Element(HeaderStyle).AlignCenter().Text("Turnos");
                            header.Cell().Element(HeaderStyle).AlignCenter().Text("Correcto");
                            header.Cell().Element(HeaderStyle).AlignCenter().Text("Errada");
                            header.Cell().Element(HeaderStyle).AlignCenter().Text("Desfase");
                            header.Cell().Element(HeaderStyle).AlignCenter().Text("Ausente");

                            static IContainer HeaderStyle(IContainer headerContainer) => headerContainer.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Black);
                        });

                        foreach (var item in statsList)
                        {
                            bool isLastDay = item.Date == endDate.Date;

                            var cell1 = table.Cell().Element(CellStyle).Text($"{item.DayName} {item.Date:dd/MM/yyyy}");
                            if (isLastDay) cell1.SemiBold();

                            var cell2 = table.Cell().Element(CellStyle).AlignCenter().Text(item.Plantilla.ToString());
                            if (isLastDay) cell2.SemiBold();

                            var cell3 = table.Cell().Element(CellStyle).AlignCenter().Text(item.Marcaciones.ToString());
                            if (isLastDay) cell3.SemiBold();

                            var cell4 = table.Cell().Element(CellStyle).AlignCenter().Text(item.TotalTurnos.ToString());
                            if (isLastDay) cell4.SemiBold();

                            var cell5 = table.Cell().Element(CellStyle).AlignCenter().Text(item.Correcto.ToString()).FontColor(Colors.Green.Darken2);
                            if (isLastDay) cell5.SemiBold();

                            var cell6 = table.Cell().Element(CellStyle).AlignCenter().Text(item.Errada.ToString()).FontColor(Colors.Amber.Darken2);
                            if (isLastDay) cell6.SemiBold();

                            var cell7 = table.Cell().Element(CellStyle).AlignCenter().Text(item.Desfase.ToString()).FontColor(Colors.Blue.Darken2);
                            if (isLastDay) cell7.SemiBold();

                            var cell8 = table.Cell().Element(CellStyle).AlignCenter().Text(item.Ausente.ToString()).FontColor(Colors.Red.Darken2);
                            if (isLastDay) cell8.SemiBold();

                            IContainer CellStyle(IContainer cellContainer)
                            {
                                var padded = cellContainer.PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten3);
                                if (isLastDay)
                                {
                                    padded = padded.Background(Colors.Indigo.Lighten5);
                                }
                                return padded;
                            }
                        }
                    });

                    if (!allAttendances.Any())
                    {
                        col.Item().PaddingTop(20).AlignCenter().Text("No se encontraron registros de marcación para el período seleccionado.").Italic().FontColor(Colors.Grey.Medium);
                    }

                    RenderWeeklyFailuresTable(col, weeklyFailures, endDate);
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Página ");
                    x.CurrentPageNumber();
                    x.Span(" de ");
                    x.TotalPages();
                });
            });
        });

        return document.GeneratePdf();
    }

    private void RenderWeeklyFailuresTable(ColumnDescriptor col, List<Attendance> failures, DateTime highlightDate)
    {
        if (failures == null || !failures.Any())
            return;

        var culture = new System.Globalization.CultureInfo("es-ES");

        col.Item().PaddingTop(20).PaddingBottom(10).Text("INCIDENCIAS ACUMULADAS DE LA SEMANA").FontSize(14).SemiBold().FontColor(Colors.Red.Darken3);

        col.Item().Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.RelativeColumn(2); // Fecha
                columns.RelativeColumn(3.5f); // Colaborador
                columns.RelativeColumn(2.5f); // Sede
                columns.RelativeColumn(1); // Entrada
                columns.RelativeColumn(1); // Salida
                columns.RelativeColumn(2); // Incidencia
            });

            table.Header(header =>
            {
                header.Cell().Element(HeaderStyle).Text("Fecha");
                header.Cell().Element(HeaderStyle).Text("Colaborador");
                header.Cell().Element(HeaderStyle).Text("Sede");
                header.Cell().Element(HeaderStyle).AlignCenter().Text("Entrada");
                header.Cell().Element(HeaderStyle).AlignCenter().Text("Salida");
                header.Cell().Element(HeaderStyle).Text("Incidencia");

                static IContainer HeaderStyle(IContainer container) => container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Black);
            });

            foreach (var item in failures)
            {
                DateTime recordDate = item.ClockIn?.Date ?? item.Shift?.StartTime.Date ?? DateTime.MinValue;
                bool isHighlight = recordDate.Date == highlightDate.Date;

                table.Cell().Element(CellStyle).Text(t =>
                {
                    var span = t.Span($"{culture.TextInfo.ToTitleCase(recordDate.ToString("dddd", culture))} {recordDate:dd/MM}");
                    if (isHighlight) span.SemiBold();
                });

                table.Cell().Element(CellStyle).Text(t =>
                {
                    var spanName = t.Span($"{item.Employee.FirstName} {item.Employee.LastName}");
                    if (isHighlight) spanName.SemiBold();
                    t.Span($" ({item.Employee.IdentificationNumber})").FontSize(8).FontColor(Colors.Grey.Medium);
                });

                table.Cell().Element(CellStyle).Text(t =>
                {
                    var span = t.Span(item.Store.Name);
                    if (isHighlight) span.SemiBold();
                });

                table.Cell().Element(CellStyle).AlignCenter().Text(t =>
                {
                    var span = t.Span(item.ClockIn.HasValue ? item.ClockIn.Value.ToString("HH:mm") : "--:--");
                    if (isHighlight) span.SemiBold();
                });

                table.Cell().Element(CellStyle).AlignCenter().Text(t =>
                {
                    var span = t.Span(item.ClockOut.HasValue ? item.ClockOut.Value.ToString("HH:mm") : "--:--");
                    if (isHighlight) span.SemiBold();
                });

                string statusStr = item.Status switch
                {
                    AttendanceStatus.MarcacionErrada => "Marcación Incompleta",
                    AttendanceStatus.SinMarcacion => "Ausente",
                    _ => item.Status.ToString()
                };
                table.Cell().Element(CellStyle).Text(t =>
                {
                    var span = t.Span(statusStr).FontColor(item.Status == AttendanceStatus.SinMarcacion ? Colors.Red.Darken2 : Colors.Amber.Darken3);
                    if (isHighlight) span.SemiBold();
                });

                IContainer CellStyle(IContainer container)
                {
                    var padded = container.PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten3);
                    if (isHighlight)
                    {
                        padded = padded.Background(Colors.Red.Lighten5);
                    }
                    return padded;
                }
            }
        });
    }

    private class WeeklyDayStats
    {
        public DateTime Date { get; set; }
        public string DayName { get; set; } = string.Empty;
        public int Plantilla { get; set; }
        public int Marcaciones { get; set; }
        public int TotalTurnos { get; set; }
        public int Correcto { get; set; }
        public int Errada { get; set; }
        public int Desfase { get; set; }
        public int Ausente { get; set; }
    }
}
