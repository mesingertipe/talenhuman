using Microsoft.EntityFrameworkCore;
using TalenHuman.Domain.Entities;

namespace TalenHuman.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Company> Companies { get; }
    DbSet<Brand> Brands { get; }
    DbSet<Store> Stores { get; }
    DbSet<Profile> Profiles { get; }
    DbSet<Employee> Employees { get; }
    DbSet<Shift> Shifts { get; }
    DbSet<Attendance> Attendances { get; }
    DbSet<Absence> Absences { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
