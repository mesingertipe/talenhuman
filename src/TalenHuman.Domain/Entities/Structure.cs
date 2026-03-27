using TalenHuman.Domain.Common;

namespace TalenHuman.Domain.Entities;

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

    // Relationships
    public ICollection<Brand> Brands { get; set; } = new List<Brand>();
}

public class Brand : BaseEntity, IMultitenant
{
    public string Name { get; set; } = string.Empty;
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }

    // Relationships
    public ICollection<Store> Stores { get; set; } = new List<Store>();
}

public class Store : BaseEntity, IMultitenant
{
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; } = string.Empty;
    public string? ExternalId { get; set; } // Custom Store ID
    public string? Code { get; set; } // External system code
    public bool IsActive { get; set; } = true;
    
    public Guid? CityId { get; set; }
    public City? City { get; set; }
    
    public Guid BrandId { get; set; }
    public Brand? Brand { get; set; }
    
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }

    // Relationships
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    public ICollection<SupervisorStore> SupervisorStores { get; set; } = new List<SupervisorStore>();
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
