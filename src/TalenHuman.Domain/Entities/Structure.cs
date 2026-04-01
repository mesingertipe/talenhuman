using TalenHuman.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace TalenHuman.Domain.Entities;

public enum PermissionAction
{
    Read = 0,
    Create = 1,
    Update = 2,
    Delete = 3,
    Export = 4,
    Approve = 5
}

public class Company : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string TaxId { get; set; } = string.Empty; // NIT
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; } = true;
    [System.Text.Json.Serialization.JsonPropertyName("countryCode")]
    public string CountryCode { get; set; } = "CO"; // Default Colombia

    [System.Text.Json.Serialization.JsonPropertyName("timeZoneId")]
    public string TimeZoneId { get; set; } = "SA Pacific Standard Time"; // Default UTC-5
    
    public string? PrivacyPolicyText { get; set; }

    // Relationships
    public ICollection<Brand> Brands { get; set; } = new List<Brand>();
    public ICollection<CompanyModule> CompanyModules { get; set; } = new List<CompanyModule>();
}

public class Brand : BaseEntity, IMultitenant
{
    public string Name { get; set; } = string.Empty;
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
    public bool IsActive { get; set; } = true;

    // Relationships
    public ICollection<Store> Stores { get; set; } = new List<Store>();
}

public class Store : BaseEntity, IMultitenant
{
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; } = string.Empty;
    public string? ExternalId { get; set; } // Custom Store ID
    public string? Code { get; set; } // External system code
    public string? BiometricId { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Attendance Operational Settings
    public bool UseSequentialPairing { get; set; } = true; // "Modo Marcaciones" (Default)
    public string OperationalDayStart { get; set; } = "05:00"; // Default 5 AM
    public string DefaultStartTime { get; set; } = "08:00"; // Store standard start
    public string DefaultEndTime { get; set; } = "17:00"; // Store standard end
    
    public Guid? CityId { get; set; }
    public City? City { get; set; }
    
    public Guid BrandId { get; set; }
    public Brand? Brand { get; set; }
    
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }

    public Guid? DistrictId { get; set; }
    public District? District { get; set; }
    
    // Relationships
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    public ICollection<SupervisorStore> SupervisorStores { get; set; } = new List<SupervisorStore>();
}

public class District : BaseEntity, IMultitenant
{
    public string Name { get; set; } = string.Empty;
    
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
    
    public Guid? SupervisorId { get; set; }
    public User? Supervisor { get; set; }
    
    // Relationships
    public ICollection<Store> Stores { get; set; } = new List<Store>();
}

public class SupervisorStore : IMultitenant
{
    public Guid UserId { get; set; }
    public User? User { get; set; }
    
    public Guid StoreId { get; set; }
    public Store? Store { get; set; }
    
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
}

public class Profile : BaseEntity, IMultitenant
{
    public string Name { get; set; } = string.Empty; // e.g., Chef, Mesero, Bartender
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
}

public class City : BaseEntity, IMultitenant
{
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
    
    // Relationships
    public ICollection<Store> Stores { get; set; } = new List<Store>();
}

public class SystemSetting : BaseEntity
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Group { get; set; } = "General"; // e.g., "Storage", "Email"
}

public class Module : BaseEntity
{
    public string Code { get; set; } = string.Empty; // e.g., "CORE", "ATTENDANCE", "TIPS"
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; } // Lucide icon name
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<CompanyModule> CompanyModules { get; set; } = new List<CompanyModule>();
}

public class CompanyModule : BaseEntity
{
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }

    public Guid ModuleId { get; set; }
    public Module? Module { get; set; }

    public bool IsActive { get; set; } = true;
}

public class ModulePermission : BaseEntity, IMultitenant
{
    public Guid RoleId { get; set; } // Reference to AspNetRoles
    
    public Guid ModuleId { get; set; }
    public Module? Module { get; set; }

    public string? SubModuleCode { get; set; } // e.g., "CORE_STORES", "CORE_EMPLOYEES"

    public PermissionAction Action { get; set; }
    public bool IsAllowed { get; set; } = true;

    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
}
