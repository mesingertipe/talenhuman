using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Domain.Entities;

namespace TalenHuman.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task SeedAsync(ApplicationDbContext context, UserManager<User> userManager, RoleManager<Role> roleManager)
    {
        // 1. Seed / Migrate Roles
        string[] roles = { "SuperAdmin", "Admin", "Gerente", "Distrital", "RH", "Empleado", "Soporte" };
        
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
            new Module { Code = "SALES", Name = "Gestión Comercial", Icon = "TrendingUp", DisplayOrder = 3 },
            new Module { Code = "ADVANCED", Name = "Gestión del Modelo", Icon = "Layout", DisplayOrder = 4 },
            new Module { Code = "SYSTEM", Name = "Administración Sistema", Icon = "Settings", DisplayOrder = 5 }
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
            try {
                await SeedStoreTypesForCompanyAsync(context, comp.Id);
            } catch (Exception ex) {
                Console.WriteLine($"Error seeding StoreTypes for company {comp.Id}: {ex.Message}");
            }
        }
        await context.SaveChangesAsync();
        await SeedHolidaysAsync(context);

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

        // 6. Seed Initial Support User if not exists
        var supportEmail = "soporte@talenhuman.com";
        var existingSupport = await userManager.FindByEmailAsync(supportEmail);
        if (existingSupport == null)
        {
            var supportUser = new User
            {
                UserName = supportEmail,
                Email = supportEmail,
                FullName = "Agente de Soporte",
                CompanyId = company1Id,
                EmailConfirmed = true
            };

            await userManager.CreateAsync(supportUser, "Soporte123!");
            await userManager.AddToRoleAsync(supportUser, "Soporte");
        }

        // 7. Seed Initial FAQs
        if (!await context.FaqArticles.AnyAsync())
        {
            var faqs = new List<FaqArticle>
            {
                // GENERAL / ACCESO
                new FaqArticle {
                    Question = "¿Cómo recupero mi contraseña de acceso?",
                    Answer = "En la pantalla de inicio de sesión, haga clic en 'Olvidé mi contraseña'. Ingrese su correo corporativo y recibirá un código o enlace para restablecerla.",
                    TargetRoles = "Empleado,Gerente,Distrital,RH,Admin,SuperAdmin",
                    Category = "Acceso y Cuenta",
                    CompanyId = company1Id,
                    IsSystem = true
                },
                new FaqArticle {
                    Question = "¿Cómo instalo la aplicación en mi celular (PWA)?",
                    Answer = "Si ingresa desde su dispositivo móvil, verá un botón para 'Instalar App' en la pantalla principal o menú. En iOS (Safari), toque el botón 'Compartir' y luego 'Agregar a Inicio'. En Android, use la opción 'Instalar aplicación' del menú de su navegador.",
                    TargetRoles = "Empleado,Gerente,Distrital",
                    Category = "Acceso y Cuenta",
                    CompanyId = company1Id,
                    IsSystem = true
                },
                
                // NOVEDADES Y VACACIONES
                new FaqArticle {
                    Question = "¿Cómo solicito vacaciones y cómo se calculan los días?",
                    Answer = "Diríjase al menú 'Novedades' y cree una nueva solicitud seleccionando 'Vacaciones'. El sistema descontará automáticamente los días festivos que estén configurados y calculará los días efectivos según si su empresa contabiliza días hábiles o calendario. También puede solicitar días pagados en dinero si está habilitado por su empresa.",
                    TargetRoles = "Empleado,Gerente,Distrital,RH",
                    Category = "Novedades y Permisos",
                    CompanyId = company1Id,
                    IsSystem = true
                },
                new FaqArticle {
                    Question = "¿Por qué no me deja crear una solicitud de Novedad?",
                    Answer = "Verifique que: 1) Tenga los días suficientes si es una novedad con cupo (ej. Vacaciones). 2) Las fechas no se superpongan con otra novedad previamente aprobada. 3) Haya adjuntado los soportes obligatorios, como incapacidades médicas.",
                    TargetRoles = "Empleado,Gerente",
                    Category = "Novedades y Permisos",
                    CompanyId = company1Id,
                    IsSystem = true
                },

                // HORARIOS Y ASISTENCIA
                new FaqArticle {
                    Question = "¿Qué significan los colores en la programación de Turnos?",
                    Answer = "El sistema utiliza indicadores visuales: Verde (Turno completado y a tiempo), Amarillo (Llegada tarde o salida anticipada), Rojo (Falta o turno sin marcación alguna) y Azul (Turno programado pendiente por ejecutar).",
                    TargetRoles = "Gerente,Distrital,RH,Admin",
                    Category = "Horarios y Marcaciones",
                    CompanyId = company1Id,
                    IsSystem = true
                },
                new FaqArticle {
                    Question = "¿Cómo se realiza la Aprobación Semanal Operativa?",
                    Answer = "El Gerente debe ir a 'Operaciones' > 'Aprobación de Turnos'. Se listarán las semanas cerradas. Una vez que se verifique que todas las marcaciones (llegadas y salidas) de los empleados cuadran con los turnos, debe hacer clic en 'Aprobar Semana', lo cual enviará el corte de nómina a Recursos Humanos.",
                    TargetRoles = "Gerente,Distrital,RH,Admin",
                    Category = "Horarios y Marcaciones",
                    CompanyId = company1Id,
                    IsSystem = true
                },
                new FaqArticle {
                    Question = "¿Qué hacer si un empleado olvidó marcar entrada o salida?",
                    Answer = "El gerente de la tienda puede ingresar al módulo 'Marcaciones' para ajustar manualmente el registro y dejar un comentario de auditoría que explique el motivo (ej. 'Falla biométrica' o 'Olvido de marcación').",
                    TargetRoles = "Gerente,Distrital,RH",
                    Category = "Horarios y Marcaciones",
                    CompanyId = company1Id,
                    IsSystem = true
                },

                // VENTAS Y PREDICTIVOS
                new FaqArticle {
                    Question = "¿Para qué sirven las Reglas Predictivas de Horarios?",
                    Answer = "Las reglas predictivas vinculan el tráfico de ventas con la necesidad de personal. Al configurarlas, el 'ShiftScheduler' (Programador) le sugerirá de manera automática la cobertura de empleados recomendada basándose en el historial de ventas y las 'Franjas Horarias' de mayor demanda.",
                    TargetRoles = "Gerente,Distrital,Admin",
                    Category = "Ventas y Analítica",
                    CompanyId = company1Id,
                    IsSystem = true
                },
                new FaqArticle {
                    Question = "¿Cómo se registran las metas o ventas diarias?",
                    Answer = "En la sección 'Ventas Maestras' > 'Gestión de Ventas', seleccione su Tienda, Canal de Venta (ej. Físico, Domicilios) y la fecha, para registrar el valor de 'Venta Neta', número de transacciones y Ticket Promedio. Esto alimenta el panel de Analítica BI.",
                    TargetRoles = "Gerente,Distrital,Admin",
                    Category = "Ventas y Analítica",
                    CompanyId = company1Id,
                    IsSystem = true
                },

                // SOPORTE Y SISTEMA
                new FaqArticle {
                    Question = "¿Dónde encuentro las políticas y comunicados de la empresa?",
                    Answer = "Diríjase a 'Gestión del Modelo' > 'Centro de Comunicados' o revise las alertas que emergen en el inicio de su sesión. Allí RH o Gerencia General publica boletines, manuales operativos y reglamentos.",
                    TargetRoles = "Empleado,Gerente,Distrital,RH,Admin,SuperAdmin",
                    Category = "General y Comunicados",
                    CompanyId = company1Id,
                    IsSystem = true
                },
                new FaqArticle {
                    Question = "¿Cómo usar la Mesa de Ayuda de Soporte Técnico?",
                    Answer = "Si encuentra una falla técnica en la plataforma o tiene un bloqueo, vaya a 'Soporte y Ayuda' > 'Mesa de Ayuda'. Cree un nuevo Ticket seleccionando la severidad de su incidente (Baja, Media, Alta, Crítica) y chatee en vivo con nuestro equipo de Soporte.",
                    TargetRoles = "Gerente,Distrital,RH,Admin",
                    Category = "Soporte Técnico",
                    CompanyId = company1Id,
                    IsSystem = true
                },
                new FaqArticle {
                    Question = "¿Cómo habilito días en dinero para vacaciones o cambio la base de cálculo?",
                    Answer = "(Solo para Administradores): Vaya a 'Panel de Sistema' > 'Empresas'. Edite la configuración de su compañía, y en la pestaña 'Configuración Vacacional' marque la casilla de 'Permitir Días en Dinero'. Allí también puede definir si descuentan en Días Hábiles o Calendario.",
                    TargetRoles = "Admin,SuperAdmin",
                    Category = "Administración del Sistema",
                    CompanyId = company1Id,
                    IsSystem = true
                }
            };
            context.FaqArticles.AddRange(faqs);
            await context.SaveChangesAsync();
        }
    }

    public static async Task SeedPermissionsForCompanyAsync(ApplicationDbContext context, Guid companyId)
    {
        var allModules = await context.Modules.ToListAsync();
        var roles = await context.Roles.ToListAsync();

        var coreMod = allModules.FirstOrDefault(m => m.Code == "CORE");
        var opsMod = allModules.FirstOrDefault(m => m.Code == "OPERATIONS");
        var salesMod = allModules.FirstOrDefault(m => m.Code == "SALES");
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
            new { Module = "CORE", Sub = "STORE_TYPES" },
            new { Module = "CORE", Sub = "EMPLOYEES" },
            new { Module = "OPERATIONS", Sub = "SHIFTS" },
            new { Module = "OPERATIONS", Sub = "RECORDS" },
            new { Module = "OPERATIONS", Sub = "NOVELTIES" },
            new { Module = "OPERATIONS", Sub = "SHIFT_APPROVAL" },
            new { Module = "SALES", Sub = "SALES_DATA" },
            new { Module = "SALES", Sub = "SALES_CHANNELS" },
            new { Module = "SALES", Sub = "SALES_ANALYTICS" },
            new { Module = "SALES", Sub = "SALES_TIME_BANDS" },
            new { Module = "SALES", Sub = "PREDICTIVE_RULES" },
            new { Module = "SALES", Sub = "SPECIAL_DATES" },
            new { Module = "ADVANCED", Sub = "MONITORING" },
            new { Module = "SYSTEM", Sub = "USERS" },
            new { Module = "SYSTEM", Sub = "PERMISSIONS" },
            new { Module = "SYSTEM", Sub = "AUDIT" },
            new { Module = "SYSTEM", Sub = "COMPANIES" },
            new { Module = "SYSTEM", Sub = "SYSTEM_CONFIG" },
            new { Module = "SYSTEM", Sub = "OPERATIONAL_SETTINGS" }
        };

        // Seed Permission Matrix for EACH company to ensure new sub-modules are included
        var companyIds = await context.Companies.IgnoreQueryFilters().Select(c => c.Id).ToListAsync();
        foreach (var cId in companyIds) 
        {
            foreach (var role in roles)
            {
                foreach (var item in subModules)
                {
                    var mid = item.Module switch {
                        "CORE" => coreMod.Id,
                        "OPERATIONS" => opsMod.Id,
                        "SALES" => salesMod?.Id ?? Guid.Empty,
                        "ADVANCED" => advMod?.Id ?? Guid.Empty,
                        "SYSTEM" => sysMod.Id,
                        _ => Guid.Empty
                    };

                    if (mid == Guid.Empty) continue;

                    // 1. Grant ALL to Admin/SuperAdmin/RH (V13.0 Policy)
                    if (role.Name == "SuperAdmin" || role.Name == "Admin" || role.Name == "RH")
                    {
                        foreach (PermissionAction action in Enum.GetValues(typeof(PermissionAction)))
                        {
                            var exists = await context.ModulePermissions.IgnoreQueryFilters()
                                .AnyAsync(p => p.CompanyId == cId && p.RoleId == role.Id && p.ModuleId == mid && p.SubModuleCode == item.Sub && p.Action == action);
                            
                            if (!exists) 
                            {
                                context.ModulePermissions.Add(new ModulePermission { 
                                    RoleId = role.Id, ModuleId = mid, SubModuleCode = item.Sub,
                                    Action = action, IsAllowed = true, 
                                    CompanyId = cId 
                                });
                            }
                        }
                    }
                }
            }
        }
        await context.SaveChangesAsync();
    }

    private static async Task SeedStoreTypesForCompanyAsync(ApplicationDbContext context, Guid companyId)
    {
        var defaultType = await context.StoreTypes.IgnoreQueryFilters()
            .FirstOrDefaultAsync(st => st.CompanyId == companyId && st.Name == "Tienda Normal");

        if (defaultType == null)
        {
            defaultType = new StoreType 
            { 
                Name = "Tienda Normal", 
                IsActive = true, 
                CompanyId = companyId 
            };
            context.StoreTypes.Add(defaultType);
            await context.SaveChangesAsync();
        }

        // Update stores without a type
        var storesWithoutType = await context.Stores.IgnoreQueryFilters()
            .Where(s => s.CompanyId == companyId && (s.StoreTypeId == Guid.Empty || s.StoreTypeId == null))
            .ToListAsync();

        foreach (var store in storesWithoutType)
        {
            store.StoreTypeId = defaultType.Id;
            context.Stores.Update(store);
        }

        if (storesWithoutType.Any())
        {
            await context.SaveChangesAsync();
        }
    }

    private static async Task SeedHolidaysAsync(ApplicationDbContext context)
    {
        // Initial manual trigger for the first deployment
        if (await context.PredictiveSpecialDates.IgnoreQueryFilters().AnyAsync(d => d.IsSystem)) return;

        // Note: The PredictiveHolidaysWorker will handle the continuous seeding.
        // We could manually trigger a one-time generation here if we want immediate data.
    }
}
