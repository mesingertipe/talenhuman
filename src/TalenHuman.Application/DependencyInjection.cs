using Microsoft.Extensions.DependencyInjection;
using System.Reflection;
using TalenHuman.Application.Common.Interfaces;

namespace TalenHuman.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));
        services.AddScoped<IImportService, Services.ImportService>();
        services.AddScoped<Services.AttendanceService>();
        // Add Automapper or FluentValidation if needed
        return services;
    }
}
