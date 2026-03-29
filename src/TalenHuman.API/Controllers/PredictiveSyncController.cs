using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Domain.Entities;
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

            var record = new SalesData
            {
                StoreId = store.Id,
                Timestamp = dto.Timestamp,
                Amount = dto.Amount,
                TicketCount = dto.TicketCount,
                OrderCount = dto.OrderCount,
                CompanyId = tenantId
            };

            _context.SalesData.Add(record);
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
    public int OrderCount { get; set; }
}
