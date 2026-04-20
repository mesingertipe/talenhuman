using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Application.Common.Models;
using TalenHuman.Domain.Entities;
using TalenHuman.Domain.Common;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SalesController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public SalesController(IApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    private async Task<List<Guid>> GetAuthorizedStoreIdsAsync()
    {
        var companyId = _tenantProvider.GetTenantId();
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
            return new List<Guid>();

        // If SuperAdmin or Admin, they see everything in the company
        if (User.IsInRole("SuperAdmin") || User.IsInRole("Admin"))
        {
            return await _context.Stores
                .Where(s => s.CompanyId == companyId)
                .Select(s => s.Id)
                .ToListAsync();
        }

        // If Distrital, they see stores in their district
        if (User.IsInRole("Distrital"))
        {
            var user = await _context.Users.FindAsync(userId);
            if (user?.DistrictId != null)
            {
                return await _context.Stores
                    .Where(s => s.DistrictId == user.DistrictId && s.CompanyId == companyId)
                    .Select(s => s.Id)
                    .ToListAsync();
            }
        }

        // If Gerente or anyone else, they see stores they are specifically assigned as supervisor
        return await _context.Set<SupervisorStore>()
            .Where(ss => ss.UserId == userId && ss.CompanyId == companyId)
            .Select(ss => ss.StoreId)
            .ToListAsync();
    }

    [HttpPost("batch")]
    public async Task<ActionResult<SalesImportResultDto>> PostBatch([FromBody] List<SalesDataDto> data)
    {
        var result = new SalesImportResultDto();
        var companyId = _tenantProvider.GetTenantId();

        // Caché local para evitar consultas repetitivas de canales en el mismo lote
        var channelsCache = new Dictionary<string, Guid>();

        foreach (var item in data)
        {
            try
            {
                var allowedStores = await GetAuthorizedStoreIdsAsync();
                var cleanExternalId = item.StoreExternalId?.Trim();
                var store = await _context.Stores
                    .FirstOrDefaultAsync(s => (s.ExternalId.Trim() == cleanExternalId || s.Code.Trim() == cleanExternalId) && s.CompanyId == companyId);

                if (store == null || !allowedStores.Contains(store.Id))
                {
                    result.ErrorCount++;
                    result.Messages.Add($"Tienda '{item.StoreExternalId}' no encontrada o sin permiso de acceso.");
                    continue;
                }

                // Lógica de Canal Dinámico
                if (!channelsCache.TryGetValue(item.Canal, out var channelId))
                {
                    var channel = await _context.SalesChannels
                        .FirstOrDefaultAsync(c => c.Name == item.Canal && c.CompanyId == companyId);
                    
                    if (channel == null)
                    {
                        channel = new SalesChannel { Name = item.Canal, CompanyId = companyId };
                        _context.SalesChannels.Add(channel);
                        await _context.SaveChangesAsync(CancellationToken.None);
                    }
                    channelId = channel.Id;
                    channelsCache[item.Canal] = channelId;
                }

                var promedio = item.TicketPromedio > 0 ? item.TicketPromedio : 
                                    (item.CantidadTickets > 0 ? item.VentaNeta / item.CantidadTickets : 0);

                var existingSales = await _context.SalesData.FirstOrDefaultAsync(s => 
                    s.StoreId == store.Id && 
                    s.RecordDate == item.RecordDate && 
                    s.Canal == item.Canal && 
                    s.CompanyId == companyId);

                if (existingSales != null)
                {
                    existingSales.VentaNeta = item.VentaNeta;
                    existingSales.CantidadTickets = item.CantidadTickets;
                    existingSales.TicketPromedio = promedio;
                    existingSales.Comensales = item.Comensales;
                    existingSales.SalesChannelId = channelId;
                    existingSales.Timestamp = ColombiaTime.Now;
                    _context.SalesData.Update(existingSales);
                }
                else
                {
                    var sales = new SalesData
                    {
                        StoreId = store.Id,
                        RecordDate = item.RecordDate,
                        VentaNeta = item.VentaNeta,
                        CantidadTickets = item.CantidadTickets,
                        TicketPromedio = promedio,
                        Canal = item.Canal,
                        Comensales = item.Comensales,
                        SalesChannelId = channelId,
                        CompanyId = companyId,
                        Timestamp = ColombiaTime.Now
                    };
                    _context.SalesData.Add(sales);
                }
                result.SuccessCount++;
            }
            catch (Exception ex)
            {
                result.ErrorCount++;
                result.Messages.Add($"Error procesando registro {item.RecordDate}: {ex.Message}");
            }
        }

        await _context.SaveChangesAsync(CancellationToken.None);
        return Ok(result);
    }

    [HttpGet]
    public async Task<ActionResult> GetSales(
        [FromQuery] DateTime? startDate, 
        [FromQuery] DateTime? endDate, 
        [FromQuery] Guid? storeId,
        [FromQuery] Guid? channelId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        var companyId = _tenantProvider.GetTenantId();
        var allowedStores = await GetAuthorizedStoreIdsAsync();
        var query = _context.SalesData
            .Include(s => s.Store)
            .Include(s => s.SalesChannel)
            .Where(s => s.CompanyId == companyId && allowedStores.Contains(s.StoreId))
            .AsQueryable();

        if (storeId.HasValue && allowedStores.Contains(storeId.Value))
            query = query.Where(s => s.StoreId == storeId.Value);
        else if (storeId.HasValue)
             query = query.Where(s => false); // Filtered out
            
        if (channelId.HasValue)
            query = query.Where(s => s.SalesChannelId == channelId.Value);

        if (startDate.HasValue)
            query = query.Where(s => s.RecordDate >= startDate.Value);
            
        if (endDate.HasValue)
            query = query.Where(s => s.RecordDate <= endDate.Value);

        var totalCount = await query.CountAsync();
        
        var items = await query
            .OrderByDescending(s => s.RecordDate)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new {
                s.Id,
                s.RecordDate,
                s.StoreId,
                StoreName = s.Store.Name,
                s.VentaNeta,
                s.CantidadTickets,
                s.TicketPromedio,
                s.Canal,
                s.Comensales,
                s.SalesChannelId,
                ChannelName = s.SalesChannel != null ? s.SalesChannel.Name : s.Canal
            })
            .ToListAsync();

        return Ok(new { items, totalCount });
    }

    [HttpGet("analytics/summary")]
    public async Task<ActionResult> GetSummary([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] Guid? storeId, [FromQuery] Guid? channelId)
    {
        var companyId = _tenantProvider.GetTenantId();
        var start = startDate?.Date ?? ColombiaTime.Now.Date;
        var end = endDate?.Date.AddDays(1) ?? start.AddDays(1);

        var bands = await _context.SalesTimeBands
            .Where(b => b.CompanyId == companyId && b.IsActive)
            .OrderBy(b => b.StartTime)
            .ToListAsync();

        var allowedStores = await GetAuthorizedStoreIdsAsync();
        var sales = await _context.SalesData
            .Where(s => s.CompanyId == companyId && s.RecordDate >= start && s.RecordDate < end)
            .Where(s => allowedStores.Contains(s.StoreId))
            .Where(s => !storeId.HasValue || s.StoreId == storeId.Value)
            .Where(s => !channelId.HasValue || s.SalesChannelId == channelId.Value)
            .ToListAsync();

        var results = bands.Select(band => new
        {
            band.Name,
            band.Color,
            VentaNeta = sales.Where(s => s.RecordDate.TimeOfDay >= band.StartTime && s.RecordDate.TimeOfDay < band.EndTime).Sum(s => s.VentaNeta),
            CantidadTickets = sales.Where(s => s.RecordDate.TimeOfDay >= band.StartTime && s.RecordDate.TimeOfDay < band.EndTime).Sum(s => s.CantidadTickets),
            Comensales = sales.Where(s => s.RecordDate.TimeOfDay >= band.StartTime && s.RecordDate.TimeOfDay < band.EndTime).Sum(s => s.Comensales),
            TicketPromedio = sales.Where(s => s.RecordDate.TimeOfDay >= band.StartTime && s.RecordDate.TimeOfDay < band.EndTime).Any() 
                ? sales.Where(s => s.RecordDate.TimeOfDay >= band.StartTime && s.RecordDate.TimeOfDay < band.EndTime).Average(s => s.TicketPromedio) : 0
        });

        return Ok(results);
    }

    [HttpGet("analytics/evolution")]
    public async Task<ActionResult> GetEvolution([FromQuery] DateTime startDate, [FromQuery] Guid? storeId, [FromQuery] Guid? channelId, [FromQuery] int weeksBack = 3)
    {
        var companyId = _tenantProvider.GetTenantId();
        var targetDate = startDate.Date;
        
        // Cargar data del día actual
        var allowedStores = await GetAuthorizedStoreIdsAsync();
        var currentDayData = await _context.SalesData
            .Where(s => s.CompanyId == companyId && s.RecordDate >= targetDate && s.RecordDate < targetDate.AddDays(1))
            .Where(s => allowedStores.Contains(s.StoreId))
            .Where(s => !storeId.HasValue || s.StoreId == storeId.Value)
            .Where(s => !channelId.HasValue || s.SalesChannelId == channelId.Value)
            .OrderBy(s => s.RecordDate)
            .Select(s => new { s.RecordDate, s.VentaNeta, s.CantidadTickets, s.Comensales, s.TicketPromedio })
            .ToListAsync();

        // 1. Obtener reglas para determinar estacionalidad (si hay storeId)
        var lookbackCount = weeksBack;
        var strategy = PredictiveComparisonStrategy.IntelligentComparison;

        if (storeId.HasValue)
        {
            var store = await _context.Stores.FindAsync(storeId);
            if (store != null)
            {
                var activeRules = await _context.PredictiveShiftRules
                    .Where(r => r.StoreTypeId == store.StoreTypeId && r.IsActive)
                    .ToListAsync();
                
                if (activeRules.Any())
                {
                    // V13.5: Union de requerimientos - Usar el máximo periodo necesario entre todas las reglas
                    lookbackCount = activeRules.Max(r => r.LookbackWeeks > 0 ? r.LookbackWeeks : weeksBack);
                    
                    // Si alguna regla requiere comparación inteligente, se habilita globalmente para el día
                    if (activeRules.Any(r => r.ComparisonStrategy == PredictiveComparisonStrategy.IntelligentComparison))
                    {
                        strategy = PredictiveComparisonStrategy.IntelligentComparison;
                    }
                    else
                    {
                        strategy = activeRules.First().ComparisonStrategy;
                    }
                }
            }
        }

        // 2. Determinar si el día objetivo es Especial (Festivo/Evento)
        var company = await _context.Companies.FindAsync(companyId);
        var countryCode = company?.CountryCode ?? "CO";

        var specialDates = await _context.PredictiveSpecialDates
            .Where(d => (d.Country == countryCode && d.IsSystem) || d.CompanyId == companyId)
            .ToListAsync();

        var targetSpecial = specialDates.FirstOrDefault(d => d.Date.Date == targetDate.Date);

        // 3. Buscar fechas comparables recursivamente
        var historicalDates = new List<DateTime>();
        
        if (targetSpecial != null && strategy == PredictiveComparisonStrategy.IntelligentComparison)
        {
            // Caso Festivo: buscar festivos anteriores (del mismo nombre o tipo)
            var comparableHolidays = specialDates
                .Where(h => h.Date < targetDate && (h.Name == targetSpecial.Name || h.Type == targetSpecial.Type))
                .OrderByDescending(h => h.Date)
                .Take(lookbackCount)
                .Select(h => h.Date.Date)
                .ToList();
            
            historicalDates.AddRange(comparableHolidays);
        }
        else
        {
            // Caso Normal: buscar últimas N semanas saltando festivos
            var searchDate = targetDate.AddDays(-7);
            int found = 0;
            int maxAttempts = 52; // Evitar loop infinito (1 año atrás max)

            while (found < lookbackCount && maxAttempts > 0)
            {
                var isHistoricalSpecial = specialDates.Any(d => d.Date.Date == searchDate.Date);
                
                if (!isHistoricalSpecial || strategy == PredictiveComparisonStrategy.FixedWeeks)
                {
                    historicalDates.Add(searchDate);
                    found++;
                }
                
                searchDate = searchDate.AddDays(-7);
                maxAttempts--;
            }
        }

        if (historicalDates.Count == 0) historicalDates.Add(targetDate.AddDays(-7)); // Fallback

        var historicalData = await _context.SalesData
            .Where(s => s.CompanyId == companyId)
            .Where(s => allowedStores.Contains(s.StoreId))
            .Where(s => historicalDates.Contains(s.RecordDate.Date))
            .Where(s => !storeId.HasValue || s.StoreId == storeId.Value)
            .Where(s => !channelId.HasValue || s.SalesChannelId == channelId.Value)
            .ToListAsync();

        var numWeeks = historicalDates.Count;

        // 1. Agrupar por (Día, Hora, Canal) para sumar registros intradía (si los hay)
        var dailyHourlyChannelData = historicalData
            .GroupBy(s => new { Date = s.RecordDate.Date, Hour = s.RecordDate.Hour, ChannelId = s.SalesChannelId })
            .Select(g => new
            {
                g.Key.Date,
                g.Key.Hour,
                g.Key.ChannelId,
                VentaNeta = g.Sum(x => x.VentaNeta),
                Tickets = g.Sum(x => x.CantidadTickets),
                Comensales = g.Sum(x => x.Comensales),
                TicketPromedio = g.Average(x => x.TicketPromedio)
            })
            .ToList();

        // 2. Agrupar por Hora para el resultado final
        var averagedHistory = dailyHourlyChannelData
            .GroupBy(d => d.Hour)
            .Select(g => new
            {
                Time = new TimeSpan(g.Key, 0, 0).ToString(@"hh\:mm"),
                VentaNetaAvg = g.Sum(x => x.VentaNeta) / numWeeks,
                TicketsAvg = (decimal)g.Sum(x => x.Tickets) / numWeeks,
                ComensalesAvg = (decimal)g.Sum(x => x.Comensales) / numWeeks,
                TicketPromedioAvg = g.Average(x => x.TicketPromedio),
                Channels = g.GroupBy(c => c.ChannelId)
                    .Select(cg => new {
                        ChannelId = cg.Key,
                        VentaNetaAvg = cg.Sum(x => x.VentaNeta) / numWeeks,
                        TicketsAvg = (decimal)cg.Sum(x => x.Tickets) / numWeeks,
                        ComensalesAvg = (decimal)cg.Sum(x => x.Comensales) / numWeeks
                    }).ToList()
            })
            .OrderBy(x => x.Time)
            .ToList();

        return Ok(new { 
            current = currentDayData, 
            history = averagedHistory,
            historicalDates = historicalDates.Select(d => d.ToString("yyyy-MM-dd")).ToList(),
            isHoliday = targetSpecial != null,
            holidayName = targetSpecial?.Name
        });
    }

    [HttpGet("analytics/channels")]
    public async Task<ActionResult> GetChannelSummary([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] Guid? storeId)
    {
        var companyId = _tenantProvider.GetTenantId();
        var start = startDate?.Date ?? ColombiaTime.Now.Date;
        var end = endDate?.Date.AddDays(1) ?? start.AddDays(1);

        var allowedStores = await GetAuthorizedStoreIdsAsync();
        var sales = await _context.SalesData
            .Include(s => s.SalesChannel)
            .Where(s => s.CompanyId == companyId && s.RecordDate >= start && s.RecordDate < end)
            .Where(s => allowedStores.Contains(s.StoreId))
            .Where(s => !storeId.HasValue || s.StoreId == storeId.Value)
            .ToListAsync();

        var results = sales.GroupBy(s => s.SalesChannel != null ? s.SalesChannel.Name : (s.Canal ?? "General"))
            .Select(g => new
            {
                Name = g.Key,
                VentaNeta = g.Sum(x => x.VentaNeta),
                CantidadTickets = g.Sum(x => x.CantidadTickets),
                Comensales = g.Sum(x => x.Comensales),
                TicketPromedio = g.Any() ? g.Average(x => (decimal)x.TicketPromedio) : 0
            })
            .OrderByDescending(x => x.VentaNeta)
            .ToList();

        return Ok(results);
    }

    [HttpGet("analytics/weekly-trend")]
    public async Task<ActionResult> GetWeeklyTrend([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] Guid? storeId, [FromQuery] Guid? channelId)
    {
        var companyId = _tenantProvider.GetTenantId();
        var start = startDate?.Date ?? ColombiaTime.Now.Date.AddDays(-6);
        var end = endDate?.Date.AddDays(1) ?? start.AddDays(7);

        var allowedStores = await GetAuthorizedStoreIdsAsync();
        var sales = await _context.SalesData
            .Where(s => s.CompanyId == companyId && s.RecordDate >= start && s.RecordDate < end)
            .Where(s => allowedStores.Contains(s.StoreId))
            .Where(s => !storeId.HasValue || s.StoreId == storeId.Value)
            .Where(s => !channelId.HasValue || s.SalesChannelId == channelId.Value)
            .ToListAsync();

        var results = sales.GroupBy(s => s.RecordDate.Date)
            .Select(g => new
            {
                Date = g.Key,
                VentaNeta = g.Sum(x => x.VentaNeta),
                CantidadTickets = g.Sum(x => x.CantidadTickets),
                Comensales = g.Sum(x => x.Comensales),
                TicketPromedio = g.Average(x => x.TicketPromedio)
            })
            .OrderBy(x => x.Date)
            .ToList();

        return Ok(results);
    }
}
