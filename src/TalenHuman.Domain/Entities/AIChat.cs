using System;
using System.Collections.Generic;
using TalenHuman.Domain.Common;

namespace TalenHuman.Domain.Entities;

public class AIChatSession : BaseEntity, IMultitenant
{
    public Guid UserId { get; set; }
    public User? User { get; set; }
    
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
    
    public DateTime CreatedAt { get; set; } = ColombiaTime.Now;
    public DateTime LastUpdatedAt { get; set; } = ColombiaTime.Now;

    public bool IsActive { get; set; } = true;
    
    public ICollection<AIChatMessage> Messages { get; set; } = new List<AIChatMessage>();
}

public class AIChatMessage : BaseEntity
{
    public Guid SessionId { get; set; }
    public AIChatSession? Session { get; set; }
    
    public string Role { get; set; } = string.Empty; // "user" or "model"
    public string Content { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = ColombiaTime.Now;
}
