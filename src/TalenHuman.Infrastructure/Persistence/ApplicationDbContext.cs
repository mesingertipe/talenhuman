using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Common;
using TalenHuman.Domain.Entities;
using System.Reflection;

namespace TalenHuman.Infrastructure.Persistence;

public class ApplicationDbContext : IdentityDbContext<User, Role, Guid>
{
    private readonly ITenantProvider _tenantProvider;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ITenantProvider tenantProvider) : base(options)
    {
        _tenantProvider = tenantProvider;
    }

    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Store> Stores => Set<Store>();
    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Shift> Shifts => Set<Shift>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<Absence> Absences => Set<Absence>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Apply Multitenancy Global Filter
        var tenantId = _tenantProvider.GetTenantId();
        
        builder.Entity<User>().HasQueryFilter(u => u.CompanyId == tenantId);
        builder.Entity<Brand>().HasQueryFilter(b => b.CompanyId == tenantId);
        builder.Entity<Store>().HasQueryFilter(s => s.CompanyId == tenantId);
        builder.Entity<Profile>().HasQueryFilter(p => p.CompanyId == tenantId);
        builder.Entity<Employee>().HasQueryFilter(e => e.CompanyId == tenantId);
        builder.Entity<Shift>().HasQueryFilter(s => s.CompanyId == tenantId);
        builder.Entity<Attendance>().HasQueryFilter(a => a.CompanyId == tenantId);
        builder.Entity<Absence>().HasQueryFilter(a => a.CompanyId == tenantId);

        // Configure Relationships
        builder.Entity<Store>()
            .HasOne(s => s.Brand)
            .WithMany(b => b.Stores)
            .HasForeignKey(s => s.BrandId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Employee>()
            .HasOne(e => e.Store)
            .WithMany(s => s.Employees)
            .HasForeignKey(e => e.StoreId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Shift>()
            .HasOne(s => s.Employee)
            .WithMany(e => e.Shifts)
            .HasForeignKey(s => s.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);
            
        // Additional configuration can be added here
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantProvider.GetTenantId();

        foreach (var entry in ChangeTracker.Entries<IMultitenant>())
        {
            if (entry.State == EntityState.Added && entry.Entity.CompanyId == Guid.Empty)
            {
                entry.Entity.CompanyId = tenantId;
            }
        }

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
