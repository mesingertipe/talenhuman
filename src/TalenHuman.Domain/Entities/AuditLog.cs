using TalenHuman.Domain.Common;

namespace TalenHuman.Domain.Entities;

public class AuditLog : BaseEntity, IMultitenant
{
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }

    public Guid? UserId { get; set; }
    public string UserName { get; set; } = string.Empty;

    public string Action { get; set; } = string.Empty; // e.g., "CREATE", "UPDATE", "DELETE", "LOGIN"
    public string EntityType { get; set; } = string.Empty; // e.g., "User", "Store", "Novedad"
    public string? EntityId { get; set; } // Reference to the exact record

    public string? Details { get; set; } // Can store JSON representing old/new values
    public string? IpAddress { get; set; }
    
    public bool IsSuccess { get; set; } = true;
}
