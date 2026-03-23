using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TalenHuman.Domain.Entities;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;

    public AuthController(UserManager<User> userManager, SignInManager<User> signInManager)
    {
        _userManager = userManager;
        _signInManager = signInManager;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.Users
            .Include(u => u.Company)
            .FirstOrDefaultAsync(u => u.NormalizedEmail == request.Email.ToUpper());

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

        return Ok(new
        {
            token = new JwtSecurityTokenHandler().WriteToken(token),
            user = new { user.Email, user.FullName, user.CompanyId, user.MustChangePassword, roles, companyName = user.Company?.Name }
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
        
        // TODO: Send email with token. For now, we log it to console/response to allow testing.
        Console.WriteLine($"Password Reset Token for {user.Email}: {token}");
        
        return Ok(new { 
            message = "Token generado exitosamente.", 
            debugToken = token // REMOVE THIS in production
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
}

public class LoginRequest
{
    public string Email { get; set; } = null!;
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
