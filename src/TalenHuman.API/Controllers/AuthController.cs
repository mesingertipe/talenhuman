using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TalenHuman.Domain.Entities;
using Microsoft.Extensions.Configuration;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IIdentityService _identityService;
    private readonly IEmailService _emailService;
    private readonly IAuditService _auditService;

    public AuthController(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        ApplicationDbContext context,
        IConfiguration configuration,
        IIdentityService identityService,
        IEmailService emailService,
        IAuditService auditService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _context = context;
        _configuration = configuration;
        _identityService = identityService;
        _emailService = emailService;
        _auditService = auditService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // Search by Email or Username (IdentificationNumber)
        var user = await _userManager.Users
            .IgnoreQueryFilters()
            .Include(u => u.Company)
            .FirstOrDefaultAsync(u => 
                u.NormalizedEmail == request.Email.ToUpper() || 
                u.UserName == request.Email);

        if (user == null) 
        {
            await _auditService.LogAsync("LOGIN_ATTEMPT", "Auth", null, $"Intento de acceso fallido para: {request.Email}", false);
            return Unauthorized("Credenciales inválidas");
        }

        if (user.Company != null && !user.Company.IsActive)
        {
            await _auditService.LogAsync("LOGIN_ATTEMPT", "Auth", user.Id.ToString(), "Empresa inactiva", false, user.Id, user.CompanyId, user.Email);
            return Unauthorized("La empresa asociada a esta cuenta se encuentra inactiva. Contacte a soporte.");
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
        if (!result.Succeeded) 
        {
            await _auditService.LogAsync("LOGIN_ATTEMPT", "Auth", user.Id.ToString(), "Contraseña incorrecta", false, user.Id, user.CompanyId, user.Email);
            return Unauthorized("Credenciales inválidas");
        }

        var roles = await _userManager.GetRolesAsync(user);
        
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim("CompanyId", user.CompanyId.ToString())
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("SuperSecretKey123!_TalenHuman_2026_Secure"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: "TalenHuman",
            audience: "TalenHuman",
            claims: claims,
            expires: DateTime.Now.AddDays(7),
            signingCredentials: creds
        );

        // Load store info for Managers/Supervisors
        Guid? storeId = null;
        string? storeName = null;
        string? storeExternalId = null;
        List<Guid> storeIds = new();

        var employee = await _context.Employees
            .Include(e => e.Store)
            .FirstOrDefaultAsync(e => e.Id == user.EmployeeId);

        if (employee?.Store != null)
        {
            storeId = employee.StoreId;
            storeName = employee.Store.Name;
            storeExternalId = employee.Store.ExternalId;
        }

        // Load all assigned stores (primarily for Distritales / Fallback for Managers)
        var supervisorStoreAssignments = await _context.SupervisorStores
            .Include(ss => ss.Store)
            .Where(ss => ss.UserId == user.Id)
            .ToListAsync();

        storeIds = supervisorStoreAssignments.Select(ss => ss.StoreId).ToList();

        // Fallback for storeName/ExternalId if not found via Employee
        if (storeId == null && supervisorStoreAssignments.Any())
        {
            var primary = supervisorStoreAssignments.First().Store;
            if (primary != null)
            {
                storeId = primary.Id;
                storeName = primary.Name;
                storeExternalId = primary.ExternalId;
            }
        }

        // Log success
        await _auditService.LogAsync("LOGIN", "Auth", user.Id.ToString(), "Login exitoso", true, user.Id, user.CompanyId, user.Email);

        return Ok(new
        {
            token = new JwtSecurityTokenHandler().WriteToken(token),
            user = new { 
                user.Email, 
                user.FullName, 
                user.CompanyId, 
                user.MustChangePassword, 
                roles, 
                companyName = user.Company?.Name,
                countryCode = user.Company?.CountryCode,
                timeZoneId = user.Company?.TimeZoneId,
                storeId,
                storeName,
                storeExternalId,
                storeIds
            }
        });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var user = await _userManager.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.NormalizedEmail == request.Email.ToUpper());
        if (user == null) 
        {
            return Ok(new { message = "Si el correo está registrado, recibirás un código de recuperación." });
        }

        // Generate 6-digit OTP
        var resetCode = Random.Shared.Next(100000, 1000000).ToString();
        user.ResetCode = resetCode;
        user.ResetCodeExpiry = DateTime.UtcNow.AddMinutes(15);
        await _userManager.UpdateAsync(user);
        
        // Construct elite/corporate email
        var emailBody = $@"
        <div style='font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px;'>
            <div style='margin-bottom: 30px;'>
                <h2 style='color: #4f46e5; margin: 0;'>TalenHuman</h2>
                <p style='color: #64748b; font-size: 14px; font-weight: 600;'>ELITE V12 - SEGURIDAD</p>
            </div>
            <h1 style='font-size: 24px; font-weight: 950; letter-spacing: -0.02em;'>Recupera tu acceso</h1>
            <p style='line-height: 1.6;'>Hola {user.FullName}, hemos recibido una solicitud para restablecer tu contraseña. Ingresa el siguiente código de seguridad en la aplicación para continuar:</p>
            <div style='background: #f8fafc; border: 2px dashed #4f46e5; padding: 25px; text-align: center; border-radius: 20px; margin: 30px 0;'>
                <span style='font-size: 48px; font-weight: 900; color: #4f46e5; letter-spacing: 0.2em;'>{resetCode}</span>
            </div>
            <p style='font-size: 13px; color: #94a3b8; text-align: center;'>Este código vencerá en 15 minutos.</p>
            <p style='font-size: 13px; color: #94a3b8;'>Si no solicitaste este cambio, puedes ignorar este correo con seguridad.</p>
            <hr style='border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;' />
            <p style='font-size: 12px; font-weight: 700; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.05em;'>© 2026 TalenHuman Platform - Gestión Elite de Talento Humano</p>
        </div>";

        await _emailService.SendEmailAsync(user.Email!, "Código de Recuperación - TalenHuman", emailBody);
        
        return Ok(new { 
            message = "Código enviado a tu correo exitosamente."
        });
    }

    [HttpPost("reset-password-with-token")]
    public async Task<IActionResult> ResetPasswordWithToken([FromBody] ResetPasswordRequest request)
    {
        var user = await _userManager.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.NormalizedEmail == request.Email.ToUpper());
        if (user == null) return BadRequest(new { message = "Email no encontrado." });

        if (user.ResetCode != request.Token || user.ResetCodeExpiry < DateTime.UtcNow)
        {
            return BadRequest(new { message = "El código es incorrecto o ha expirado." });
        }

        // Use custom reset flow since we bypass standard Identity tokens
        var removeResult = await _userManager.RemovePasswordAsync(user);
        if (!removeResult.Succeeded && (await _userManager.HasPasswordAsync(user)))
        {
             return BadRequest(new { message = "Error al procesar el cambio de clave.", errors = removeResult.Errors });
        }

        var result = await _userManager.AddPasswordAsync(user, request.NewPassword);
        
        if (result.Succeeded)
        {
            // Clear code after successful reset
            user.ResetCode = null;
            user.ResetCodeExpiry = null;
            await _userManager.UpdateAsync(user);
            return Ok(new { message = "Contraseña restablecida exitosamente." });
        }

        return BadRequest(new { message = "La nueva contraseña no cumple con los requisitos de seguridad.", errors = result.Errors });
    }

    [HttpPost("sync-employee-users")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> SyncEmployeeUsers()
    {
        var employeesWithoutUser = await _context.Employees
            .Where(e => e.UserId == null)
            .ToListAsync();

        int created = 0;
        var errors = new List<string>();

        foreach (var emp in employeesWithoutUser)
        {
            try 
            {
                var generatedEmail = $"{emp.IdentificationNumber}@talenhuman.local";
                var (succeeded, userId) = await _identityService.CreateUserAsync(
                    emp.IdentificationNumber,
                    generatedEmail,
                    emp.IdentificationNumber,
                    $"{emp.FirstName} {emp.LastName}",
                    emp.CompanyId,
                    "Empleado",
                    emp.Id);

                if (succeeded)
                {
                    emp.UserId = userId;
                    created++;
                }
                else
                {
                    errors.Add($"Error creando usuario para {emp.IdentificationNumber}");
                }
            }
            catch (Exception ex)
            {
                errors.Add($"Excepción para {emp.IdentificationNumber}: {ex.Message}");
            }
        }

        if (created > 0)
        {
            await _context.SaveChangesAsync();
        }

        return Ok(new { 
            message = $"Proceso completado. {created} usuarios creados.",
            errors = errors 
        });
    }

    [HttpPost("self-service-reset")]
    public async Task<IActionResult> SelfServiceReset([FromBody] SelfServiceResetRequest request)
    {
        var employee = await _context.Employees
            .IgnoreQueryFilters()
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.IdentificationNumber == request.IdentificationNumber);

        if (employee == null || employee.User == null)
            return BadRequest("No se encontró un registro válido para los datos proporcionados.");

        if (!employee.BirthDate.HasValue || employee.BirthDate.Value.Date != request.BirthDate.Date)
            return BadRequest("Los datos de validación son incorrectos.");

        // Generate token and reset
        var user = employee.User;
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, request.NewPassword);

        if (!result.Succeeded)
            return BadRequest(new { message = "Error al restablecer la contraseña.", errors = result.Errors });

        user.MustChangePassword = false;
        await _userManager.UpdateAsync(user);

        return Ok(new { message = "Contraseña restablecida correctamente." });
    }
}

public class LoginRequest
{
    public string Email { get; set; } = null!; // Can be Email or IdentificationNumber
    public string Password { get; set; } = null!;
}

public class ForgotPasswordRequest
{
    public string Email { get; set; } = null!;
}

public class ResetPasswordRequest
{
    public string Email { get; set; } = null!;
    public string Token { get; set; } = null!;
    public string NewPassword { get; set; } = null!;
}

public class SelfServiceResetRequest
{
    public string IdentificationNumber { get; set; } = null!;
    public DateTime BirthDate { get; set; }
    public string NewPassword { get; set; } = null!;
}
