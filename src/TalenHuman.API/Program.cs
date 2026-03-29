using TalenHuman.Infrastructure;
using TalenHuman.Application;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using System.Text;
using Microsoft.AspNetCore.HttpOverrides;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder => builder.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = "TalenHuman",
        ValidAudience = "TalenHuman",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("SuperSecretKey123!_TalenHuman_2026_Secure"))
    };
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => {
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "TalenHuman API", Version = "v1" });
    
    // Support for X-Api-Key in Swagger
    c.AddSecurityDefinition("ApiKey", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "API Key authentication using the 'X-Api-Key' header. Example: 'your-api-key-here'",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Name = "X-Api-Key",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "ApiKeyScheme"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "ApiKey"
                },
                In = Microsoft.OpenApi.Models.ParameterLocation.Header
            },
            new List<string>()
        }
    });
});

var app = builder.Build();

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

// Configure the HTTP request pipeline.
app.UseSwagger();
app.UseSwaggerUI(c => {
    c.SwaggerEndpoint("v1/swagger.json", "TalenHuman API V1");
});

app.UseHttpsRedirection();

app.UseCors("AllowAll");

// Middleware for API Key authentication and Tenant resolution
app.UseMiddleware<TalenHuman.Infrastructure.Middleware.TenantApiKeyMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Seed database (resilient — retries up to 5 times so the container survives a slow DB)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var maxRetries = 5;
    for (int attempt = 1; attempt <= maxRetries; attempt++)
    {
        try
        {
            var context = services.GetRequiredService<TalenHuman.Infrastructure.Persistence.ApplicationDbContext>();
            var userManager = services.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<TalenHuman.Domain.Entities.User>>();
            var roleManager = services.GetRequiredService<Microsoft.AspNetCore.Identity.RoleManager<TalenHuman.Domain.Entities.Role>>();
            
            var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
            if (pendingMigrations.Any())
            {
                logger.LogInformation("Found {Count} pending migrations: {Migrations}. Applying now...", pendingMigrations.Count(), string.Join(", ", pendingMigrations));
                await context.Database.MigrateAsync();
                logger.LogInformation("Database migrated successfully.");
            }
            else
            {
                logger.LogInformation("No pending migrations found.");
            }
            
            await TalenHuman.Infrastructure.Persistence.DbInitializer.SeedAsync(context, userManager, roleManager);
            logger.LogInformation("Database seed check completed.");
            break;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "CRITICAL: Database migration/seed attempt {Attempt}/{Max} failed.", attempt, maxRetries);
            if (attempt == maxRetries)
                logger.LogError("Could not finalize DB setup after {Max} attempts. Check connection or SQL permissions.", maxRetries);
            else
                await Task.Delay(TimeSpan.FromSeconds(3));
        }
    }
}

app.Run();
