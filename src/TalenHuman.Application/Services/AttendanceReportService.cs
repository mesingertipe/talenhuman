using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Microsoft.EntityFrameworkCore;
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
        // 1. Fetch Recipients Configuration (from SystemSettings or default)
        // For this demo, we'll assume we send to Admins, Distritales, and Gerentes
        var users = await _context.Users
            .Where(u => u.CompanyId == companyId && u.IsActive)
            .ToListAsync();

        foreach (var user in users)
        {
            // Dummy role check (In real scenario, use UserManager)
            // But we have DistrictId and Store assignments in the User/SupervisorStore table
            
            byte[]? pdfContent = null;
            string subject = $"Reporte de Asistencia TalenHuman - {date:dd/MM/yyyy}";

            // Distrital Flow
            if (user.DistrictId != null)
            {
                pdfContent = await GeneratePdfReportAsync(companyId, date, districtId: user.DistrictId);
            }
            // Gerente Flow (Requires fetching store assignments)
            else 
            {
                var managedStores = await _context.SupervisorStores
                    .Where(ss => ss.UserId == user.Id)
                    .Select(ss => ss.StoreId)
                    .ToListAsync();

                if (managedStores.Any())
                {
                    pdfContent = await GeneratePdfReportAsync(companyId, date, storeIds: managedStores);
                }
                else
                {
                    // Admin Flow (No specific assignment = Global)
                    pdfContent = await GeneratePdfReportAsync(companyId, date);
                }
            }

            if (pdfContent != null)
            {
                await _notificationService.SendNotificationAsync(new NotificationRequest
                {
                    To = user.Email!,
                    Subject = subject,
                    Message = $"Hola {user.FullName}, adjunto enviamos el consolidado de asistencia correspondiente al día {date:dd/MM/yyyy}.<br/><br/>Saludos,<br/>Equipo TalenHuman.",
                    Attachments = new List<AttachmentDto>
                    {
                        new AttachmentDto { Filename = $"Asistencia_{date:yyyyMMdd}.pdf", Content = pdfContent, ContentType = "application/pdf" }
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

        // 2. Fetch Attendance Data for the same day
        var attendanceQuery = _context.Attendances
            .Include(a => a.Store)
            .Where(a => a.CompanyId == companyId && a.ClockIn.Date == date.Date);

        if (districtId.HasValue)
        {
            attendanceQuery = attendanceQuery.Where(a => a.Store.DistrictId == districtId.Value);
        }
        else if (storeIds != null && storeIds.Any())
        {
            attendanceQuery = attendanceQuery.Where(a => storeIds.Contains(a.StoreId));
        }

        var attendanceData = await attendanceQuery.ToListAsync();
        var attendanceGroups = attendanceData.GroupBy(a => a.StoreId)
            .ToDictionary(g => g.Key, g => g.ToList());

        // 3. Fetch Employee counts per store for "Plantilla"
        var employeeCounts = await _context.Employees
            .Where(e => e.CompanyId == companyId && e.IsActive)
            .GroupBy(e => e.StoreId)
            .Select(g => new { StoreId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.StoreId, x => x.Count);

        // 4. Project stats using ALL stores (Left Join Logic)
        var stats = allContextStores.Select(s => {
            var records = attendanceGroups.ContainsKey(s.Id) ? attendanceGroups[s.Id] : new List<Attendance>();
            var empCount = employeeCounts.ContainsKey(s.Id) ? employeeCounts[s.Id] : 0;
            return new {
                Store = s.Name,
                Plantilla = empCount,
                Total = records.Count(),
                Correct = records.Count(x => x.Status == AttendanceStatus.Correcto),
                Errada = records.Count(x => x.Status == AttendanceStatus.MarcacionErrada),
                Desfasada = records.Count(x => x.Status == AttendanceStatus.Desfasado),
                SinMarcacion = records.Count(x => x.Status == AttendanceStatus.SinMarcacion)
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
                        col.Item().Text("TALENHUMAN").FontSize(20).SemiBold().FontColor(Colors.Indigo.Medium);
                        col.Item().Text("Elite V12 - Reporte Consolidado").FontSize(12).FontColor(Colors.Grey.Medium);
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
                            columns.RelativeColumn(3);
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                        });

                        table.Header(header =>
                        {
                            header.Cell().Element(CellStyle).Text("Sede");
                            header.Cell().Element(CellStyle).AlignCenter().Text("Plantilla");
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
                            table.Cell().Element(Padding).AlignCenter().Text(item.Total.ToString());
                            table.Cell().Element(Padding).AlignCenter().Text($"{item.Correct}").FontColor(Colors.Green.Darken2);
                            table.Cell().Element(Padding).AlignCenter().Text($"{item.Errada}").FontColor(Colors.Amber.Darken2);
                            table.Cell().Element(Padding).AlignCenter().Text($"{item.Desfasada}").FontColor(Colors.Blue.Darken2);
                            table.Cell().Element(Padding).AlignCenter().Text($"{item.SinMarcacion}").FontColor(Colors.Red.Darken2);

                            static IContainer Padding(IContainer container) => container.PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten3);
                        }
                    });



                    if (!attendanceData.Any())
                    {
                        col.Item().PaddingTop(20).AlignCenter().Text("No se encontraron registros de marcación para la fecha seleccionada.").Italic().FontColor(Colors.Grey.Medium);
                    }

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
}
