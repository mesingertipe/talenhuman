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
    public DbSet<User> Users => Set<User>();
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
    public DbSet<SalesChannel> SalesChannels => Set<SalesChannel>();
    public DbSet<SalesTimeBand> SalesTimeBands => Set<SalesTimeBand>();
    public DbSet<BiometricRecord> BiometricRecords => Set<BiometricRecord>();
    public DbSet<District> Districts => Set<District>();
    public DbSet<AuditLog> AuditLogs { get; set; } = null!;
    public DbSet<SyncLog> SyncLogs { get; set; } = null!;
    public DbSet<UserCredential> UserCredentials { get; set; } = null!;
    public DbSet<TalenHuman.Domain.Entities.Module> Modules => Set<TalenHuman.Domain.Entities.Module>();
    public DbSet<CompanyModule> CompanyModules => Set<CompanyModule>();
    public DbSet<ModulePermission> ModulePermissions => Set<ModulePermission>();
    public DbSet<Comunicado> Comunicados => Set<Comunicado>();
    public DbSet<NotificationLog> NotificationLogs => Set<NotificationLog>();
    public DbSet<OperationalSetting> OperationalSettings => Set<OperationalSetting>();
    public DbSet<WeeklyApproval> WeeklyApprovals => Set<WeeklyApproval>();
    public DbSet<WeeklyApprovalLog> WeeklyApprovalLogs => Set<WeeklyApprovalLog>();
    public DbSet<StoreType> StoreTypes => Set<StoreType>();
    public DbSet<PredictiveShiftRule> PredictiveShiftRules => Set<PredictiveShiftRule>();
    public DbSet<PredictiveShiftRuleProfile> PredictiveShiftRuleProfiles => Set<PredictiveShiftRuleProfile>();
    public Guid TenantId => _tenantProvider.GetTenantId();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Apply Multitenancy Global Filter
        builder.Entity<User>().HasQueryFilter(u => u.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<Brand>().HasQueryFilter(b => b.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<Store>().HasQueryFilter(s => s.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<City>().HasQueryFilter(c => c.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<Profile>().HasQueryFilter(p => p.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<Employee>().HasQueryFilter(e => e.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<Shift>().HasQueryFilter(s => s.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<Attendance>().HasQueryFilter(a => a.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<Absence>().HasQueryFilter(a => a.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<Jornada>().HasQueryFilter(j => j.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<NovedadTipo>().HasQueryFilter(n => n.CompanyId == TenantId || TenantId == Guid.Empty || n.EsPlantilla);
        builder.Entity<Novedad>().HasQueryFilter(n => n.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<NovedadLog>().HasQueryFilter(n => n.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<SupervisorStore>().HasQueryFilter(s => s.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<ApiKey>().HasQueryFilter(a => a.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<ExternalApiConfig>().HasQueryFilter(e => e.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<SalesData>().HasQueryFilter(s => s.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<SalesChannel>().HasQueryFilter(s => s.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<SalesTimeBand>().HasQueryFilter(s => s.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<BiometricRecord>().HasQueryFilter(b => b.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<NovedadAdjunto>().HasQueryFilter(n => n.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<AuditLog>().HasQueryFilter(a => a.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<CompanyModule>().HasQueryFilter(c => c.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<ModulePermission>().HasQueryFilter(m => m.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<Comunicado>().HasQueryFilter(c => c.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<NotificationLog>().HasQueryFilter(n => n.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<OperationalSetting>().HasQueryFilter(o => o.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<WeeklyApproval>().HasQueryFilter(w => w.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<WeeklyApprovalLog>().HasQueryFilter(w => w.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<StoreType>().HasQueryFilter(s => s.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<PredictiveShiftRule>().HasQueryFilter(p => p.CompanyId == TenantId || TenantId == Guid.Empty);
        builder.Entity<PredictiveShiftRuleProfile>().HasQueryFilter(p => p.CompanyId == TenantId || TenantId == Guid.Empty);

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

        // Performance Indices
        builder.Entity<Novedad>().HasIndex(n => new { n.CompanyId, n.FechaInicio });
        builder.Entity<Novedad>().HasIndex(n => new { n.CompanyId, n.EmpleadoId, n.Status });
        builder.Entity<Attendance>().HasIndex(a => new { a.CompanyId, a.EmployeeId, a.ClockIn });
        builder.Entity<Attendance>().HasIndex(a => new { a.CompanyId, a.StoreId, a.ClockIn });
        builder.Entity<Shift>().HasIndex(s => new { s.CompanyId, s.EmployeeId, s.StartTime });
        builder.Entity<Shift>().HasIndex(s => new { s.CompanyId, s.StoreId, s.StartTime });
        builder.Entity<BiometricRecord>().HasIndex(b => new { b.CompanyId, b.RecordDate });
        builder.Entity<BiometricRecord>().HasIndex(b => new { b.CompanyId, b.DeviceUser });
        builder.Entity<Employee>().HasIndex(e => new { e.CompanyId, e.IdentificationNumber });
        builder.Entity<Employee>().HasIndex(e => new { e.CompanyId, e.IsActive });
        builder.Entity<AuditLog>().HasIndex(a => new { a.CompanyId, a.CreatedAt });
        builder.Entity<AuditLog>().HasIndex(a => new { a.UserId, a.CreatedAt });
        builder.Entity<SyncLog>().HasIndex(s => new { s.CompanyId, s.CreatedAt });
        builder.Entity<SalesData>().HasIndex(s => new { s.CompanyId, s.StoreId, s.RecordDate, s.Canal }).IsUnique();

        builder.Entity<SalesData>()
            .Property(s => s.VentaNeta)
            .HasPrecision(18, 2);

        builder.Entity<SalesData>()
            .Property(s => s.TicketPromedio)
            .HasPrecision(18, 2);

        builder.Entity<SalesData>()
            .HasOne(s => s.SalesChannel)
            .WithMany()
            .HasForeignKey(s => s.SalesChannelId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.Entity<NovedadLog>().HasIndex(n => new { n.CompanyId, n.NovedadId, n.CreatedAt });
        builder.Entity<NovedadAdjunto>().HasIndex(n => new { n.CompanyId, n.NovedadId });
        builder.Entity<NotificationLog>().HasIndex(n => new { n.CompanyId, n.UserId, n.CreatedAt });
        builder.Entity<WeeklyApproval>().HasIndex(w => new { w.CompanyId, w.StoreId, w.WeekStartDate });
        builder.Entity<WeeklyApprovalLog>().HasIndex(w => new { w.CompanyId, w.WeeklyApprovalId, w.ActionAt });
        builder.Entity<User>().HasIndex(u => u.CompanyId);
        builder.Entity<UserCredential>().HasIndex(u => u.UserId);
        builder.Entity<SalesTimeBand>().HasIndex(s => new { s.CompanyId, s.Name }).IsUnique();

        // Predictive Rules Many-to-Many
        builder.Entity<PredictiveShiftRuleProfile>()
            .HasKey(rp => new { rp.RuleId, rp.ProfileId });

        builder.Entity<PredictiveShiftRuleProfile>()
            .HasOne(rp => rp.Rule)
            .WithMany(r => r.RuleProfiles)
            .HasForeignKey(rp => rp.RuleId);

        builder.Entity<Store>()
            .HasOne(s => s.StoreType)
            .WithMany(st => st.Stores)
            .HasForeignKey(s => s.StoreTypeId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.Entity<PredictiveShiftRule>()
            .HasOne(r => r.StoreType)
            .WithMany()
            .HasForeignKey(r => r.StoreTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<PredictiveShiftRule>()
            .Property(r => r.Ratio)
            .HasPrecision(18, 2);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantProvider.GetTenantId();
        var now = _tenantTimeProvider.Now;

        foreach (var entry in ChangeTracker.Entries<IMultitenant>())
        {
            if (entry.State == EntityState.Added && (entry.Entity.CompanyId == Guid.Empty || entry.Entity.CompanyId == null))
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
