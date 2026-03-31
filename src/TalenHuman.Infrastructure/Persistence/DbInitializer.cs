using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Domain.Entities;

namespace TalenHuman.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task SeedAsync(ApplicationDbContext context, UserManager<User> userManager, RoleManager<Role> roleManager)
    {
        // 1. Seed / Migrate Roles
        string[] roles = { "SuperAdmin", "Admin", "Gerente", "Distrital", "RH", "Empleado" };
        
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new Role { Name = role });
            }
        }

        // 2. Seed/Update Modules (Global) - ELITE V12 Standard Codes
        var standardModules = new List<Module>
        {
            new Module { Code = "CORE", Name = "Configuración Core", Icon = "Boxes", DisplayOrder = 1 },
            new Module { Code = "OPERATIONS", Name = "Operaciones Asistencia", Icon = "Activity", DisplayOrder = 2 },
            new Module { Code = "ADVANCED", Name = "Gestión del Modelo", Icon = "Layout", DisplayOrder = 3 },
            new Module { Code = "SYSTEM", Name = "Administración Sistema", Icon = "Settings", DisplayOrder = 4 }
        };

        foreach (var std in standardModules)
        {
            var existing = await context.Modules.FirstOrDefaultAsync(m => m.Code == std.Code);
            if (existing == null)
            {
                // Fallback for previous codes
                if (std.Code == "OPERATIONS") existing = await context.Modules.FirstOrDefaultAsync(m => m.Code == "ATTENDANCE");
                if (std.Code == "SYSTEM") existing = await context.Modules.FirstOrDefaultAsync(m => m.Code == "ADMIN");

                if (existing != null)
                {
                    existing.Code = std.Code;
                    existing.Name = std.Name;
                    existing.Icon = std.Icon;
                }
                else
                {
                    context.Modules.Add(std);
                }
            }
        }
        await context.SaveChangesAsync();

        var allModules = await context.Modules.ToListAsync();

        // 3. Seed Companies (Tenants)
        if (!await context.Companies.AnyAsync())
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
        }

        var allCompanies = await context.Companies.ToListAsync();

        // 4. Per-Company Seeding (Modules & Isolated Permissions)
        foreach (var comp in allCompanies)
        {
            // Activate Modules for Company
            foreach (var mod in allModules)
            {
                if (!await context.CompanyModules.AnyAsync(cm => cm.CompanyId == comp.Id && cm.ModuleId == mod.Id))
                {
                    context.CompanyModules.Add(new CompanyModule { CompanyId = comp.Id, ModuleId = mod.Id, IsActive = true });
                }
            }

            await SeedPermissionsForCompanyAsync(context, comp.Id);
        }
        await context.SaveChangesAsync();

        // 5. Seed Initial Super Admin User if not exists
        var company1Id = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var adminEmail = "admin@talenhuman.com";
        var existingAdmin = await userManager.FindByEmailAsync(adminEmail);
        
        if (existingAdmin == null)
        {
            var superAdmin = new User
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "Super Administrador",
                CompanyId = company1Id,
                EmailConfirmed = true
            };

            await userManager.CreateAsync(superAdmin, "Admin123!");
            await userManager.AddToRoleAsync(superAdmin, "SuperAdmin");
        }
    }

    public static async Task SeedPermissionsForCompanyAsync(ApplicationDbContext context, Guid companyId)
    {
        var allModules = await context.Modules.ToListAsync();
        var roles = await context.Roles.ToListAsync();

        var coreMod = allModules.FirstOrDefault(m => m.Code == "CORE");
        var opsMod = allModules.FirstOrDefault(m => m.Code == "OPERATIONS");
        var advMod = allModules.FirstOrDefault(m => m.Code == "ADVANCED");
        var sysMod = allModules.FirstOrDefault(m => m.Code == "SYSTEM");

        if (coreMod == null || opsMod == null || sysMod == null) return;

        var subModules = new[] {
            new { Module = "CORE", Sub = "BRANDS" },
            new { Module = "CORE", Sub = "CITIES" },
            new { Module = "CORE", Sub = "PROFILES" },
            new { Module = "CORE", Sub = "SCHEDULES" },
            new { Module = "CORE", Sub = "DISTRICTS" },
            new { Module = "CORE", Sub = "STORES" },
            new { Module = "CORE", Sub = "EMPLOYEES" },
            new { Module = "OPERATIONS", Sub = "SHIFTS" },
            new { Module = "OPERATIONS", Sub = "RECORDS" },
            new { Module = "OPERATIONS", Sub = "NOVELTIES" },
            new { Module = "ADVANCED", Sub = "MONITORING" },
            new { Module = "ADVANCED", Sub = "TEMPLATES" },
            new { Module = "ADVANCED", Sub = "NOVELTY_CONFIG" },
            new { Module = "SYSTEM", Sub = "USERS" },
            new { Module = "SYSTEM", Sub = "PERMISSIONS" },
            new { Module = "SYSTEM", Sub = "AUDIT" },
            new { Module = "SYSTEM", Sub = "COMPANIES" },
            new { Module = "SYSTEM", Sub = "SYSTEM_CONFIG" }
        };

        // Seed Permission Matrix for Company if it doesn't have any
        if (!await context.ModulePermissions.IgnoreQueryFilters().AnyAsync(p => p.CompanyId == companyId))
        {
            foreach (var role in roles)
            {
                foreach (var item in subModules)
                {
                    var mid = item.Module switch {
                        "CORE" => coreMod.Id,
                        "OPERATIONS" => opsMod.Id,
                        "ADVANCED" => advMod?.Id ?? Guid.Empty,
                        "SYSTEM" => sysMod.Id,
                        _ => Guid.Empty
                    };

                    if (mid == Guid.Empty) continue;

                    if (role.Name == "SuperAdmin" || role.Name == "Admin")
                    {
                        foreach (PermissionAction action in Enum.GetValues(typeof(PermissionAction)))
                        {
                            context.ModulePermissions.Add(new ModulePermission { 
                                RoleId = role.Id, ModuleId = mid, SubModuleCode = item.Sub,
                                Action = action, IsAllowed = true, 
                                CompanyId = companyId 
                            });
                        }
                    }
                    else if (role.Name == "Gerente")
                    {
                        if (item.Sub == "EMPLOYEES" || item.Module == "OPERATIONS")
                        {
                             context.ModulePermissions.Add(new ModulePermission { RoleId = role.Id, ModuleId = mid, SubModuleCode = item.Sub, Action = PermissionAction.Read, IsAllowed = true, CompanyId = companyId });
                             if (item.Module == "OPERATIONS")
                                context.ModulePermissions.Add(new ModulePermission { RoleId = role.Id, ModuleId = mid, SubModuleCode = item.Sub, Action = PermissionAction.Create, IsAllowed = true, CompanyId = companyId });
                        }
                    }
                    else if (role.Name == "Distrital")
                    {
                        if (item.Sub == "EMPLOYEES" || item.Module == "OPERATIONS")
                        {
                             context.ModulePermissions.Add(new ModulePermission { RoleId = role.Id, ModuleId = mid, SubModuleCode = item.Sub, Action = PermissionAction.Read, IsAllowed = true, CompanyId = companyId });
                             context.ModulePermissions.Add(new ModulePermission { RoleId = role.Id, ModuleId = mid, SubModuleCode = item.Sub, Action = PermissionAction.Export, IsAllowed = true, CompanyId = companyId });
                        }
                    }
                }
            }
            await context.SaveChangesAsync();
        }
    }
}
