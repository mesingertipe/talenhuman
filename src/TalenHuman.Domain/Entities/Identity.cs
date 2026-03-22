using Microsoft.AspNetCore.Identity;
using TalenHuman.Domain.Common;

namespace TalenHuman.Domain.Entities;

public class User : IdentityUser<Guid>, IMultitenant
{
    public string FullName { get; set; } = string.Empty;
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
    
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Role : IdentityRole<Guid>
{
}
