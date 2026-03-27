using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using TalenHuman.Infrastructure.Persistence;
using System;
using System.Linq;

var builder = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false)
    .AddJsonFile("appsettings.Development.json", optional: true);

var configuration = builder.Build();
var connectionString = configuration.GetConnectionString("DefaultConnection");

var services = new ServiceCollection();
services.AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(connectionString));

var serviceProvider = services.BuildServiceProvider();

using (var scope = serviceProvider.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var companies = context.Companies.ToList();
    
    Console.WriteLine($"Found {companies.Count} companies:");
    foreach (var c in companies)
    {
        Console.WriteLine($"- ID: {c.Id}, Name: {c.Name}, Country: {c.CountryCode}, Zone: {c.TimeZoneId}");
    }
}
