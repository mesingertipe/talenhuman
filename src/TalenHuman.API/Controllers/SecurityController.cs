using Fido2NetLib;
using Fido2NetLib.Objects;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using TalenHuman.Domain.Entities;
using TalenHuman.Infrastructure.Persistence;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SecurityController : ControllerBase
{
    private readonly IFido2 _fido2;
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _config;

    public SecurityController(IFido2 fido2, ApplicationDbContext context, IConfiguration config)
    {
        _fido2 = fido2;
        _context = context;
        _config = config;
    }


    [HttpPost("register/options")]
    public IActionResult RegisterOptions()
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
        var userEmail = User.Identity?.Name ?? "user@talenhuman.com";

        var user = new Fido2User
        {
            DisplayName = userEmail,
            Name = userEmail,
            Id = userId.ToByteArray()
        };

        var existingCredentials = _context.UserCredentials
            .Where(c => c.UserId == userId)
            .Select(c => new PublicKeyCredentialDescriptor(c.DescriptorId))
            .ToList();

        var authenticatorSelection = new AuthenticatorSelection
        {
            RequireResidentKey = false,
            UserVerification = UserVerificationRequirement.Preferred,
            AuthenticatorAttachment = AuthenticatorAttachment.Platform 
        };

        var options = _fido2.RequestNewCredential(user, existingCredentials, authenticatorSelection, AttestationConveyancePreference.None, null);

        HttpContext.Session.SetString("fido2.registrationOptions", options.ToJson());

        return Ok(options);
    }

    [HttpPost("register/complete")]
    public async Task<IActionResult> RegisterComplete([FromBody] AuthenticatorAttestationRawResponse attestationResponse)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
            var jsonOptions = HttpContext.Session.GetString("fido2.registrationOptions");
            if (string.IsNullOrEmpty(jsonOptions)) return BadRequest("Sesión de registro expirada.");

            var options = CredentialCreateOptions.FromJson(jsonOptions);

            var success = await _fido2.MakeNewCredentialAsync(attestationResponse, options, (args, cancellationToken) =>
            {
                return Task.FromResult(!_context.UserCredentials.Any(c => c.DescriptorId == args.CredentialId));
            });

            var newCredential = new UserCredential
            {
                UserId = userId,
                DescriptorId = success.Result!.CredentialId,
                PublicKey = success.Result.PublicKey,
                UserHandle = success.Result.User.Id,
                SignatureCounter = success.Result.Counter,
                CredType = success.Result.CredType,
                DeviceName = Request.Headers["User-Agent"].ToString()
            };

            _context.UserCredentials.Add(newCredential);
            await _context.SaveChangesAsync();

            return Ok(new { status = "success", message = "Biometría registrada correctamente." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { status = "error", message = ex.Message });
        }
    }
    [HttpPost("token")]
    public async Task<IActionResult> UpdateFirebaseToken([FromBody] string token)
    {
        var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        user.FirebaseToken = token;
        await _context.SaveChangesAsync();

        return Ok(new { status = "success" });
    }

    [HttpPost("privacy-accept")]
    public async Task<IActionResult> AcceptPrivacy()
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
        if (userId == Guid.Empty) return Unauthorized();

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        user.AcceptedPrivacyPolicy = true;
        user.PrivacyPolicyAcceptedAt = DateTime.UtcNow;
        user.AcceptanceIP = Request.HttpContext.Connection.RemoteIpAddress?.ToString();

        await _context.SaveChangesAsync();

        return Ok(new { success = true });
    }
}
