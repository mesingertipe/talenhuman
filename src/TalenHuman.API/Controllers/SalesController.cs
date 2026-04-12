using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Application.Common.Models;
using TalenHuman.Domain.Entities;

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

                var sales = new SalesData
                {
                    StoreId = store.Id,
                    RecordDate = item.RecordDate,
                    VentaNeta = item.VentaNeta,
                    CantidadTickets = item.CantidadTickets,
                    TicketPromedio = item.TicketPromedio > 0 ? item.TicketPromedio : 
                                    (item.CantidadTickets > 0 ? item.VentaNeta / item.CantidadTickets : 0),
                    Canal = item.Canal,
                    Comensales = item.Comensales,
                    Cuentas = item.Cuentas,
                    CompanyId = companyId
                };

                _context.SalesData.Add(sales);
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
    public async Task<ActionResult<IEnumerable<SalesData>>> GetSales([FromQuery] DateTime start, [FromQuery] DateTime end, [FromQuery] Guid? storeId)
    {
        var query = _context.SalesData.AsQueryable();

        if (storeId.HasValue)
            query = query.Where(s => s.StoreId == storeId.Value);

        query = query.Where(s => s.RecordDate >= start && s.RecordDate <= end);

        return await query.OrderByDescending(s => s.RecordDate).ToListAsync();
    }
}
