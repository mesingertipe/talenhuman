using Microsoft.EntityFrameworkCore;
using TalenHuman.Domain.Entities;

namespace TalenHuman.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Company> Companies { get; }
    DbSet<Brand> Brands { get; }
    DbSet<Store> Stores { get; }
    DbSet<City> Cities { get; }
    DbSet<Profile> Profiles { get; }
    DbSet<Employee> Employees { get; }
    DbSet<Shift> Shifts { get; }
    DbSet<Attendance> Attendances { get; }
    DbSet<Absence> Absences { get; }
    DbSet<Jornada> Jornadas { get; }
    DbSet<BiometricRecord> BiometricRecords { get; }
    DbSet<SupervisorStore> SupervisorStores { get; }
    DbSet<NovedadTipo> NovedadTipos { get; }
    DbSet<Novedad> Novedades { get; }
    DbSet<NovedadLog> NovedadLogs { get; }
    DbSet<NovedadAdjunto> NovedadAdjuntos { get; }
    DbSet<SystemSetting> SystemSettings { get; }
    DbSet<ApiKey> ApiKeys { get; }
    DbSet<ExternalApiConfig> ExternalApiConfigs { get; }
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<SalesData> SalesData { get; }
    DbSet<SalesChannel> SalesChannels { get; }
    DbSet<SalesTimeBand> SalesTimeBands { get; }
    DbSet<SyncLog> SyncLogs { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<District> Districts { get; }
    DbSet<TalenHuman.Domain.Entities.Module> Modules { get; }
    DbSet<CompanyModule> CompanyModules { get; }
    DbSet<ModulePermission> ModulePermissions { get; }
    DbSet<Comunicado> Comunicados { get; }
    DbSet<NotificationLog> NotificationLogs { get; }
    DbSet<OperationalSetting> OperationalSettings { get; }
    DbSet<WeeklyApproval> WeeklyApprovals { get; }
    DbSet<WeeklyApprovalLog> WeeklyApprovalLogs { get; }
    DbSet<StoreType> StoreTypes { get; }
    DbSet<PredictiveShiftRule> PredictiveShiftRules { get; }
    DbSet<PredictiveShiftRuleProfile> PredictiveShiftRuleProfiles { get; }
    DbSet<PredictiveShiftRuleChannel> PredictiveShiftRuleChannels { get; }

    DbSet<TEntity> Set<TEntity>() where TEntity : class;

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
