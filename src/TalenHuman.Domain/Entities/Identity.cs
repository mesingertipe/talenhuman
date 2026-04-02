using Microsoft.AspNetCore.Identity;
using TalenHuman.Domain.Common;

namespace TalenHuman.Domain.Entities;

public class User : IdentityUser<Guid>, IMultitenant
{
    public string FullName { get; set; } = string.Empty;
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
    
    public Guid? EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public Guid? DistrictId { get; set; }
    public District? District { get; set; }
    public bool MustChangePassword { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public string? ResetCode { get; set; }
    public DateTime? ResetCodeExpiry { get; set; }
    public string? FirebaseToken { get; set; }
    public bool AcceptedPrivacyPolicy { get; set; }
    public DateTime? PrivacyPolicyAcceptedAt { get; set; }
    public string? AcceptanceIP { get; set; }
    public string? PendingFidoOptions { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Role : IdentityRole<Guid>
{
}
