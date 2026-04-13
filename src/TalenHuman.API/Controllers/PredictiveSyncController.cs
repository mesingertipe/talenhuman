using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Domain.Entities;
using TalenHuman.Domain.Common;
using TalenHuman.Infrastructure.Persistence;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/integration")]
public class PredictiveSyncController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PredictiveSyncController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost("sync-sales")]
    public async Task<IActionResult> SyncSales([FromBody] List<SalesDataSyncDto> salesData)
    {
        var tenantId = _context.TenantId;
        var results = new SyncResult();

        foreach (var dto in salesData)
        {
            var store = await _context.Stores
                .FirstOrDefaultAsync(s => s.Code == dto.StoreCode || s.ExternalId == dto.StoreExternalId);

            if (store == null)
            {
                results.Failed.Add(new { dto.StoreCode, Error = "Store not found" });
                continue;
            }

            var existingSales = await _context.SalesData.FirstOrDefaultAsync(s => 
                s.StoreId == store.Id && 
                s.RecordDate == dto.Timestamp && 
                s.CompanyId == tenantId);

            if (existingSales != null)
            {
                existingSales.VentaNeta = dto.Amount;
                existingSales.CantidadTickets = dto.TicketCount;
                existingSales.Canal = dto.Canal ?? "General";
                existingSales.Timestamp = ColombiaTime.Now;
                _context.SalesData.Update(existingSales);
            }
            else
            {
                var record = new SalesData
                {
                    StoreId = store.Id,
                    RecordDate = dto.Timestamp,
                    VentaNeta = dto.Amount,
                    CantidadTickets = dto.TicketCount,
                    Canal = dto.Canal ?? "General",
                    CompanyId = tenantId,
                    Timestamp = ColombiaTime.Now
                };
                _context.SalesData.Add(record);
            }
            results.Created++;
        }

        await _context.SaveChangesAsync();
        return Ok(results);
    }
}

public class SalesDataSyncDto
{
    public string? StoreCode { get; set; }
    public string? StoreExternalId { get; set; }
    public DateTime Timestamp { get; set; }
    public decimal Amount { get; set; }
    public int TicketCount { get; set; }
    public string? Canal { get; set; }
}
