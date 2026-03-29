using TalenHuman.Domain.Common;

namespace TalenHuman.Domain.Entities;

public class BiometricRecord : BaseEntity, IMultitenant
{
    public string? DeviceId { get; set; } // identification
    public string? DeviceUser { get; set; } // device_user_id
    
    // Time breakdown
    public DateTime RecordDate { get; set; } // Marcacion (Date + Time)
    public DateTime CreationDate { get; set; } // creation_date
    
    // EF Core can handle these as Date/Time types in SQL
    public DateOnly? RecordDay { get; set; } // FechaMarcacion
    public TimeOnly? RecordTime { get; set; } // HoraMarcacion
    
    public string? AttendanceStatusId { get; set; }
    public string? VerificationModeId { get; set; }
    
    public DateTime SyncDate { get; set; } = ColombiaTime.Now; // FechaSincronizacion
    
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
}
