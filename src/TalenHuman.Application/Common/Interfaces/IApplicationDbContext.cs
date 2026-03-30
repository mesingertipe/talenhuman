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
    DbSet<SalesData> SalesData { get; }
    DbSet<SyncLog> SyncLogs { get; }
    DbSet<AuditLog> AuditLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
