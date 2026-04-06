using TalenHuman.Domain.Common;

namespace TalenHuman.Domain.Entities;

public class NotificationLog : BaseEntity, IMultitenant
{
    public Guid UserId { get; set; }
    public User? User { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Type { get; set; } = "System"; // Broadcast, ShiftReminder, etc.
    public string? MetadataJson { get; set; } // JSON string for deep linking
    public bool IsRead { get; set; } = false;

    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
}
