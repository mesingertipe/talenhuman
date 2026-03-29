using TalenHuman.Domain.Common;

namespace TalenHuman.Domain.Entities;

public class Employee : BaseEntity, IMultitenant
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string IdentificationNumber { get; set; } = string.Empty; // Cédula
    public DateTime? BirthDate { get; set; }
    public DateTime DateOfEntry { get; set; } = ColombiaTime.Now;
    public decimal DailySalary { get; set; }
    
    public Guid? JornadaId { get; set; }
    public Jornada? Jornada { get; set; }
    
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    
    public Guid StoreId { get; set; }
    public Store Store { get; set; } = null!;
    
    public Guid ProfileId { get; set; }
    public Profile Profile { get; set; } = null!;
    
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public bool IsActive { get; set; } = true;

    // Relationships
    public ICollection<Shift> Shifts { get; set; } = new List<Shift>();
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    public ICollection<Absence> Absences { get; set; } = new List<Absence>();
}

public class Shift : BaseEntity, IMultitenant
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    
    public Guid StoreId { get; set; }
    public Store Store { get; set; } = null!;
    
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public ShiftStatus Status { get; set; } = ShiftStatus.Scheduled;

    public bool IsDescanso { get; set; }
    public bool IsFuera { get; set; }
    public string? Observation { get; set; }
}

public enum ShiftStatus
{
    Scheduled,
    Ongoing,
    Completed,
    Cancelled,
    Missed
}

public class Attendance : BaseEntity, IMultitenant
{
    public DateTime ClockIn { get; set; }
    public DateTime? ClockOut { get; set; }
    
    public string? DeviceId { get; set; } // Biometric device ID
    public string? Location { get; set; } // Optional GPS or Store Name
    
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    
    public Guid StoreId { get; set; }
    public Store Store { get; set; } = null!;
    
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
}

public class Absence : BaseEntity, IMultitenant
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    
    public string Reason { get; set; } = string.Empty; // e.g., Disability (Incapacidad), Vacation, Permission
    public string? Observation { get; set; }
    
    public AbsenceStatus Status { get; set; } = AbsenceStatus.Pending;
    public string? ApprovedBy { get; set; } // User ID or Name
    public DateTime? ApprovedAt { get; set; }
    
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
}

public enum AbsenceStatus
{
    Pending,
    Approved,
    Rejected,
    Cancelled
}

public class Jornada : BaseEntity, IMultitenant
{
    public string Nombre { get; set; } = string.Empty;
    public double HorasDiarias { get; set; }
    public double HorasSemanales { get; set; }
    
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}

public enum NovedadCategoria
{
    Empleado,
    Tienda,
    Marca
}

public class NovedadTipo : BaseEntity, IMultitenant
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool RequiereAdjunto { get; set; } = true;
    public string? CamposConfig { get; set; } // JSON string for dynamic fields
    
    public NovedadCategoria Categoria { get; set; } = NovedadCategoria.Empleado;
    public string RolAprobador { get; set; } = "Admin"; // Default to Admin
    
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    
    public ICollection<Novedad> Novedades { get; set; } = new List<Novedad>();
}

public class Novedad : BaseEntity, IMultitenant
{
    public Guid? EmpleadoId { get; set; }
    public Employee? Empleado { get; set; }
    
    public Guid? StoreId { get; set; }
    public Store? Store { get; set; }
    
    public Guid? BrandId { get; set; }
    public Brand? Brand { get; set; }
    
    public Guid NovedadTipoId { get; set; }
    public NovedadTipo NovedadTipo { get; set; } = null!;
    
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    
    public NovedadStatus Status { get; set; } = NovedadStatus.Pendiente;
    public string? AdjuntoUrl { get; set; }
    public string? DatosDinamicos { get; set; } // JSON string for field values
    public string? Observaciones { get; set; }
    
    public int IdSolicitud { get; set; } // Human-readable auto-increment ID
    
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    
    public ICollection<NovedadLog> Logs { get; set; } = new List<NovedadLog>();
}

public enum NovedadStatus
{
    Pendiente, // Orange
    Aprobado,  // Green
    Rechazado  // Red
}

public class NovedadLog : BaseEntity, IMultitenant
{
    public Guid NovedadId { get; set; }
    public Novedad Novedad { get; set; } = null!;
    
    public Guid UsuarioId { get; set; }
    public User Usuario { get; set; } = null!;
    
    public string Accion { get; set; } = string.Empty; // Creó, Ajustó, Aprobó, Rechazó
    public string Comentario { get; set; } = string.Empty; // Obligatorio para aprobar/rechazar
    public DateTime FechaHoraColombia { get; set; } = ColombiaTime.Now;

    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
}

public class SalesData : BaseEntity, IMultitenant
{
    public DateTime Timestamp { get; set; }
    public decimal Amount { get; set; }
    public int TicketCount { get; set; }
    public int OrderCount { get; set; }
    
    public Guid StoreId { get; set; }
    public Store Store { get; set; } = null!;
    
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
}
