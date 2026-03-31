using Microsoft.AspNetCore.Identity;
using TalenHuman.Domain.Entities;

namespace TalenHuman.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task SeedAsync(ApplicationDbContext context, UserManager<User> userManager, RoleManager<Role> roleManager)
    {
        // Seed / Migrate Roles
        string[] roles = { "SuperAdmin", "Admin", "Gerente", "Distrital", "RH", "Empleado" };
        
        // Handle migration: If "Supervisor" exists, rename it to "Distrital"
        var supervisorRole = await roleManager.FindByNameAsync("Supervisor");
        if (supervisorRole != null)
        {
            supervisorRole.Name = "Distrital";
            supervisorRole.NormalizedName = "DISTRITAL";
            await roleManager.UpdateAsync(supervisorRole);
        }

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new Role { Name = role });
            }
        }


        // Seed Companies (Tenants)
        if (!context.Companies.Any())
        {
            var company1 = new Company { 
                Name = "TalenHuman Corp", 
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                CountryCode = "CO",
                TimeZoneId = "SA Pacific Standard Time"
            };
            var company2 = new Company { 
                Name = "RestoBar Group", 
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                CountryCode = "MX",
                TimeZoneId = "Central Standard Time (Mexico)"
            };
            
            context.Companies.AddRange(company1, company2);
            await context.SaveChangesAsync();

            // Seed Super Admin
            var superAdmin = new User
            {
                UserName = "admin@talenhuman.com",
                Email = "admin@talenhuman.com",
                FullName = "Super Administrador",
                CompanyId = company1.Id,
                EmailConfirmed = true
            };

            if (await userManager.FindByEmailAsync(superAdmin.Email) == null)
            {
                await userManager.CreateAsync(superAdmin, "Admin123!");
                await userManager.AddToRoleAsync(superAdmin, "SuperAdmin");
            }
        }
    }
}
