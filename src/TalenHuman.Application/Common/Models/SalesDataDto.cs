namespace TalenHuman.Application.Common.Models;

public class SalesDataDto
{
    public DateTime RecordDate { get; set; }
    public decimal VentaNeta { get; set; }
    public int CantidadTickets { get; set; }
    public decimal TicketPromedio { get; set; }
    public string Canal { get; set; } = "General";
    public Guid? SalesChannelId { get; set; }
    public int Comensales { get; set; }
    public string StoreExternalId { get; set; } = null!; // "ID Tienda" or Code
}

public class SalesImportResultDto
{
    public int SuccessCount { get; set; }
    public int ErrorCount { get; set; }
    public List<string> Messages { get; set; } = new();
}
