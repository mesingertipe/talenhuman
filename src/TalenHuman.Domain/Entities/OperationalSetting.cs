using TalenHuman.Domain.Common;

namespace TalenHuman.Domain.Entities;

public enum AttendanceMode
{
    MinMax,      // Solo primera y última marca
    Sequential,  // Marcas en orden cronológico (Detallado)
    ShiftCentric // Basado estrictamente en turnos agendados
}

public enum ShiftApprovalMode
{
    HR,      // Aprueba Recursos Humanos
    District // Aprueba Gerente Distrital
}

public class OperationalSetting : BaseEntity, IMultitenant
{
    public AttendanceMode AttendanceMode { get; set; } = AttendanceMode.Sequential;
    public ShiftApprovalMode ShiftApprovalMode { get; set; } = ShiftApprovalMode.HR;
    
    public bool EnablePushNotifications { get; set; } = true;
    public bool EnableEmailNotifications { get; set; } = true;

    // Configurable Attendance Tolerances (Minutes)
    public bool CheckInEarlyInfinite { get; set; } = true; // If true, early check-in is always considered Correct
    public int CheckInEarlyTolerance { get; set; } = 15;
    public int CheckInLateTolerance { get; set; } = 15;
    public int CheckOutTolerance { get; set; } = 15;

    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
}
