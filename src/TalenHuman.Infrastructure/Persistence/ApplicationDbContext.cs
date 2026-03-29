using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Common;
using TalenHuman.Domain.Entities;
using System.Reflection;

namespace TalenHuman.Infrastructure.Persistence;

public class ApplicationDbContext : IdentityDbContext<User, Role, Guid>, IApplicationDbContext
{
    private readonly ITenantProvider _tenantProvider;
    private readonly ITenantTimeProvider _tenantTimeProvider;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ITenantProvider tenantProvider,
        ITenantTimeProvider tenantTimeProvider) : base(options)
    {
        _tenantProvider = tenantProvider;
        _tenantTimeProvider = tenantTimeProvider;
    }

    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Store> Stores => Set<Store>();
    public DbSet<City> Cities => Set<City>();
    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Shift> Shifts => Set<Shift>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<Absence> Absences => Set<Absence>();
    public DbSet<Jornada> Jornadas => Set<Jornada>();
    public DbSet<SupervisorStore> SupervisorStores => Set<SupervisorStore>();
    public DbSet<NovedadTipo> NovedadTipos => Set<NovedadTipo>();
    public DbSet<Novedad> Novedades => Set<Novedad>();
    public DbSet<NovedadLog> NovedadLogs => Set<NovedadLog>();
    public DbSet<NovedadAdjunto> NovedadAdjuntos => Set<NovedadAdjunto>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();
    public DbSet<ApiKey> ApiKeys => Set<ApiKey>();
    public DbSet<ExternalApiConfig> ExternalApiConfigs => Set<ExternalApiConfig>();
    public DbSet<SalesData> SalesData => Set<SalesData>();
    public DbSet<BiometricRecord> BiometricRecords => Set<BiometricRecord>();
    public DbSet<District> Districts => Set<District>();

    public Guid TenantId => _tenantProvider.GetTenantId();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Apply Multitenancy Global Filter
        builder.Entity<User>().HasQueryFilter(u => u.CompanyId == TenantId);
        builder.Entity<Brand>().HasQueryFilter(b => b.CompanyId == TenantId);
        builder.Entity<Store>().HasQueryFilter(s => s.CompanyId == TenantId);
        builder.Entity<City>().HasQueryFilter(c => c.CompanyId == TenantId);
        builder.Entity<Profile>().HasQueryFilter(p => p.CompanyId == TenantId);
        builder.Entity<Employee>().HasQueryFilter(e => e.CompanyId == TenantId);
        builder.Entity<Shift>().HasQueryFilter(s => s.CompanyId == TenantId);
        builder.Entity<Attendance>().HasQueryFilter(a => a.CompanyId == TenantId);
        builder.Entity<Absence>().HasQueryFilter(a => a.CompanyId == TenantId);
        builder.Entity<Jornada>().HasQueryFilter(j => j.CompanyId == TenantId);
        builder.Entity<NovedadTipo>().HasQueryFilter(n => n.CompanyId == TenantId);
        builder.Entity<Novedad>().HasQueryFilter(n => n.CompanyId == TenantId);
        builder.Entity<NovedadLog>().HasQueryFilter(n => n.CompanyId == TenantId);
        builder.Entity<SupervisorStore>().HasQueryFilter(s => s.CompanyId == TenantId);
        builder.Entity<ApiKey>().HasQueryFilter(a => a.CompanyId == TenantId);
        builder.Entity<ExternalApiConfig>().HasQueryFilter(e => e.CompanyId == TenantId);
        builder.Entity<SalesData>().HasQueryFilter(s => s.CompanyId == TenantId);
        builder.Entity<BiometricRecord>().HasQueryFilter(b => b.CompanyId == TenantId);
        builder.Entity<District>().HasQueryFilter(d => d.CompanyId == TenantId);
        builder.Entity<NovedadAdjunto>().HasQueryFilter(n => n.CompanyId == TenantId);

        // Many-to-Many: Supervisor -> Stores
        builder.Entity<SupervisorStore>()
            .HasKey(ss => new { ss.UserId, ss.StoreId });

        builder.Entity<SupervisorStore>()
            .HasOne(ss => ss.User)
            .WithMany()
            .HasForeignKey(ss => ss.UserId);

        builder.Entity<SupervisorStore>()
            .HasOne(ss => ss.Store)
            .WithMany(s => s.SupervisorStores)
            .HasForeignKey(ss => ss.StoreId);

        // Relationships: User -> Employee
        builder.Entity<User>()
            .HasOne(u => u.Employee)
            .WithOne(e => e.User)
            .HasForeignKey<Employee>(e => e.UserId);

        // Configure Relationships
        builder.Entity<Store>()
            .HasOne(s => s.Brand)
            .WithMany(b => b.Stores)
            .HasForeignKey(s => s.BrandId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Store>()
            .HasOne(s => s.City)
            .WithMany(c => c.Stores)
            .HasForeignKey(s => s.CityId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<Store>()
            .HasOne(s => s.District)
            .WithMany(d => d.Stores)
            .HasForeignKey(s => s.DistrictId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<District>()
            .HasOne(d => d.Supervisor)
            .WithMany()
            .HasForeignKey(d => d.SupervisorId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<User>()
            .HasOne(u => u.District)
            .WithMany()
            .HasForeignKey(u => u.DistrictId)
            .OnDelete(DeleteBehavior.SetNull);

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
            
        builder.Entity<Novedad>()
            .Property(n => n.IdSolicitud)
            .ValueGeneratedOnAdd();

        builder.Entity<Novedad>()
            .HasMany(n => n.Adjuntos)
            .WithOne(a => a.Novedad)
            .HasForeignKey(a => a.NovedadId)
            .OnDelete(DeleteBehavior.Cascade);

        // Additional configuration can be added here
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantProvider.GetTenantId();
        var now = _tenantTimeProvider.Now;

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
                    entry.Entity.CreatedAt = now;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
