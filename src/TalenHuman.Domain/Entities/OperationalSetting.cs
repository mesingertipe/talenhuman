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

    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
}
