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

    public AuthController(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        ApplicationDbContext context,
        IConfiguration configuration,
        IIdentityService identityService,
        IEmailService emailService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _context = context;
        _configuration = configuration;
        _identityService = identityService;
        _emailService = emailService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // Search by Email or Username (IdentificationNumber)
        var user = await _userManager.Users
            .Include(u => u.Company)
            .FirstOrDefaultAsync(u => 
                u.NormalizedEmail == request.Email.ToUpper() || 
                u.UserName == request.Email);

        if (user == null) return Unauthorized("Credenciales inválidas");

        if (user.Company != null && !user.Company.IsActive)
            return Unauthorized("La empresa asociada a esta cuenta se encuentra inactiva. Contacte a soporte.");

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
        if (!result.Succeeded) return Unauthorized("Credenciales inválidas");

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

        // Load all assigned stores (primarily for Supervisors / Fallback for Managers)
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
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null) 
        {
            // Don't reveal that the user does not exist for security
            return Ok(new { message = "Si el correo está registrado, recibirás un enlace/token de recuperación." });
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        
        // Construct elite/corporate email
        var emailBody = $@"
        <div style='font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px;'>
            <div style='margin-bottom: 30px;'>
                <h2 style='color: #4f46e5; margin: 0;'>TalenHuman</h2>
                <p style='color: #64748b; font-size: 14px; font-weight: 600;'>ELITE V12 - SEGURIDAD</p>
            </div>
            <h1 style='font-size: 24px; font-weight: 950; letter-spacing: -0.02em;'>Recupera tu acceso</h1>
            <p style='line-height: 1.6;'>Hola {user.FullName}, hemos recibido una solicitud para restablecer tu contraseña. Ingresa el siguiente código de seguridad en la aplicación para continuar:</p>
            <div style='background: #f8fafc; border: 2px dashed #4f46e5; padding: 20px; text-align: center; border-radius: 16px; margin: 30px 0;'>
                <span style='font-size: 32px; font-weight: 900; color: #4f46e5; letter-spacing: 0.1em;'>{token}</span>
            </div>
            <p style='font-size: 13px; color: #94a3b8;'>Si no solicitaste este cambio, puedes ignorar este correo con seguridad. El código expirará pronto por razones de seguridad.</p>
            <hr style='border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;' />
            <p style='font-size: 12px; font-weight: 700; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.05em;'>© 2026 TalenHuman Platform - Gestión Elite de Talento Humano</p>
        </div>";

        await _emailService.SendEmailAsync(user.Email!, "Restablecer contraseña - TalenHuman", emailBody);
        
        return Ok(new { 
            message = "Token enviado a tu correo exitosamente."
        });
    }

    [HttpPost("reset-password-with-token")]
    public async Task<IActionResult> ResetPasswordWithToken([FromBody] ResetPasswordRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null) return BadRequest("Email no encontrado.");

        var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = "No se pudo restablecer la contraseña.", errors = result.Errors });
        }

        return Ok(new { message = "Contraseña restablecida exitosamente." });
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
