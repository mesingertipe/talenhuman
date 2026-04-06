using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;

var builder = new ConfigurationBuilder()
    .AddJsonFile("d:\\Tito Pedraza\\OneDrive\\Proyectos\\Codigo Fuente\\repos\\HumanCore\\src\\TalenHuman.API\\appsettings.json")
    .Build();

var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
optionsBuilder.UseNpgsql(builder.GetConnectionString("DefaultConnection"));

using var context = new ApplicationDbContext(optionsBuilder.Options);

var settings = context.SystemSettings.ToList();
Console.WriteLine("--- System Settings ---");
foreach (var s in settings) {
    Console.WriteLine($"Key: {s.Key} | Value: {s.Value} | Group: {s.Group}");
}
Console.WriteLine("--- End ---");
