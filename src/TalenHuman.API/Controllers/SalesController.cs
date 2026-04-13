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
                var store = await _context.Stores
                    .FirstOrDefaultAsync(s => s.ExternalId == item.StoreExternalId && s.CompanyId == companyId);

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
}
