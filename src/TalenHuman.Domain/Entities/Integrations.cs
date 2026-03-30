using TalenHuman.Domain.Common;

namespace TalenHuman.Domain.Entities;

public class ApiKey : BaseEntity, IMultitenant
{
    public string Key { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
}

public class ExternalApiConfig : BaseEntity, IMultitenant
{
    public IntegrationProvider Provider { get; set; } = IntegrationProvider.FalconCloud;
    public string BaseUrl { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty; // Should be encrypted
    public string? EnterpriseId { get; set; } // External ID for the provider
    public string? ServerNumber { get; set; } // Specific for Falcon Cloud (SRV???)
    
    public bool EnableAutoSync { get; set; } = false;
    public int SyncIntervalMinutes { get; set; } = 60;
    public DateTime? LastSyncAt { get; set; }
    
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
}

public class SyncLog : BaseEntity, IOptionalMultitenant
{
    public DateTime StartTime { get; set; } = DateTime.UtcNow;
    public DateTime? EndTime { get; set; }
    public string Status { get; set; } = "Iniciado"; // Iniciado, Exitoso, Error
    public string? ErrorMessage { get; set; }
    public int RecordsProcessed { get; set; } = 0;
    public ExecutionType ExecutionType { get; set; } = ExecutionType.Manual;
    
    public double DurationSeconds => EndTime.HasValue 
        ? (EndTime.Value - StartTime).TotalSeconds 
        : (DateTime.UtcNow - StartTime).TotalSeconds;

    public Guid? CompanyId { get; set; }
    public Company? Company { get; set; }
}

public enum ExecutionType
{
    Manual,
    Scheduled
}

public enum IntegrationProvider
{
    FalconCloud,
    HumanCoreExternal,
    CustomPost
}
