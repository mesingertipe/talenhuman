using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace TalenHuman.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));
        // Add Automapper or FluentValidation if needed
        return services;
    }
}
