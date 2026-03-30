namespace TalenHuman.Domain.Common;

public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = ColombiaTime.Now;
    public DateTime? UpdatedAt { get; set; }
}

public interface IMultitenant
{
    public Guid CompanyId { get; set; }
}

public interface IOptionalMultitenant
{
    public Guid? CompanyId { get; set; }
}
