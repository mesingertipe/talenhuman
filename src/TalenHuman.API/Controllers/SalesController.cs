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
                var cleanExternalId = item.StoreExternalId?.Trim();
                var store = await _context.Stores
                    .FirstOrDefaultAsync(s => (s.ExternalId.Trim() == cleanExternalId || s.Code.Trim() == cleanExternalId) && s.CompanyId == companyId);

                if (store == null)
                {
                    result.ErrorCount++;
                    result.Messages.Add($"Tienda '{item.StoreExternalId}' no encontrada.");
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
        var query = _context.SalesData
            .Include(s => s.Store)
            .Include(s => s.SalesChannel)
            .Where(s => s.CompanyId == companyId)
            .AsQueryable();

        if (storeId.HasValue)
            query = query.Where(s => s.StoreId == storeId.Value);
            
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
    public async Task<ActionResult> GetSummary([FromQuery] DateTime date, [FromQuery] Guid? storeId, [FromQuery] Guid? channelId)
    {
        var companyId = _tenantProvider.GetTenantId();
        var startOfDate = date.Date;
        var endOfDate = startOfDate.AddDays(1);

        var bands = await _context.SalesTimeBands
            .Where(b => b.CompanyId == companyId && b.IsActive)
            .OrderBy(b => b.StartTime)
            .ToListAsync();

        var sales = await _context.SalesData
            .Where(s => s.CompanyId == companyId && s.RecordDate >= startOfDate && s.RecordDate < endOfDate)
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
    public async Task<ActionResult> GetEvolution([FromQuery] DateTime date, [FromQuery] Guid? storeId, [FromQuery] Guid? channelId)
    {
        var companyId = _tenantProvider.GetTenantId();
        var targetDate = date.Date;
        
        // Cargar data del día actual
        var currentDayData = await _context.SalesData
            .Where(s => s.CompanyId == companyId && s.RecordDate >= targetDate && s.RecordDate < targetDate.AddDays(1))
            .Where(s => !storeId.HasValue || s.StoreId == storeId.Value)
            .Where(s => !channelId.HasValue || s.SalesChannelId == channelId.Value)
            .OrderBy(s => s.RecordDate)
            .Select(s => new { s.RecordDate, s.VentaNeta, s.CantidadTickets, s.Comensales, s.TicketPromedio })
            .ToListAsync();

        // Cargar histórico de las últimas 3 semanas (mismo día de la semana)
        var historicalDates = new List<DateTime> { targetDate.AddDays(-7), targetDate.AddDays(-14), targetDate.AddDays(-21) };
        
        var historicalData = await _context.SalesData
            .Where(s => s.CompanyId == companyId)
            .Where(s => historicalDates.Contains(s.RecordDate.Date))
            .Where(s => !storeId.HasValue || s.StoreId == storeId.Value)
            .Where(s => !channelId.HasValue || s.SalesChannelId == channelId.Value)
            .ToListAsync();

        // Agrupar histórico por hora/minuto para promediar
        var averagedHistory = historicalData
            .GroupBy(s => s.RecordDate.TimeOfDay)
            .Select(g => new
            {
                Time = g.Key,
                VentaNetaAvg = g.Average(x => x.VentaNeta),
                TicketsAvg = g.Average(x => x.CantidadTickets),
                ComensalesAvg = g.Average(x => (decimal)x.Comensales),
                TicketPromedioAvg = g.Average(x => x.TicketPromedio)
            })
            .OrderBy(x => x.Time)
            .ToList();

        return Ok(new { current = currentDayData, history = averagedHistory });
    }

    [HttpGet("analytics/channels")]
    public async Task<ActionResult> GetChannelSummary([FromQuery] DateTime date, [FromQuery] Guid? storeId)
    {
        var companyId = _tenantProvider.GetTenantId();
        var startOfDate = date.Date;
        var endOfDate = startOfDate.AddDays(1);

        var sales = await _context.SalesData
            .Include(s => s.SalesChannel)
            .Where(s => s.CompanyId == companyId && s.RecordDate >= startOfDate && s.RecordDate < endOfDate)
            .Where(s => !storeId.HasValue || s.StoreId == storeId.Value)
            .ToListAsync();

        var results = sales.GroupBy(s => s.SalesChannel != null ? s.SalesChannel.Name : (s.Canal ?? "General"))
            .Select(g => new
            {
                Name = g.Key,
                VentaNeta = g.Sum(x => x.VentaNeta),
                CantidadTickets = g.Sum(x => x.CantidadTickets),
                Comensales = g.Sum(x => x.Comensales),
                TicketPromedio = g.Average(x => (decimal)x.TicketPromedio)
            })
            .OrderByDescending(x => x.VentaNeta)
            .ToList();

        return Ok(results);
    }
}
