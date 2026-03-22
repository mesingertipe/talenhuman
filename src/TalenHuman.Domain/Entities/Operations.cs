using TalenHuman.Domain.Common;

namespace TalenHuman.Domain.Entities;

public class Employee : BaseEntity, IMultitenant
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string IdentificationNumber { get; set; } = string.Empty; // Cédula
    
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
