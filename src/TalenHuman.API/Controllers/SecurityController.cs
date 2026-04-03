using Fido2NetLib;
using Fido2NetLib.Objects;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using TalenHuman.Domain.Entities;
using TalenHuman.Infrastructure.Persistence;
using TalenHuman.Application.Common.Interfaces;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SecurityController : ControllerBase
{
    private readonly IFido2 _fido2;
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _config;
    private readonly IAuditService _auditService;
    private readonly UserManager<User> _userManager;
    private readonly IIdentityService _identityService;
    private readonly ISystemSettingsService _settingsService;

    public SecurityController(
        IFido2 fido2, 
        ApplicationDbContext context, 
        IConfiguration config, 
        IAuditService auditService,
        UserManager<User> userManager,
        IIdentityService identityService,
        ISystemSettingsService settingsService)
    {
        _fido2 = fido2;
        _context = context;
        _config = config;
        _auditService = auditService;
        _userManager = userManager;
        _identityService = identityService;
        _settingsService = settingsService;
    }


    [HttpPost("register/options")]
    public async Task<IActionResult> RegisterOptions()
    {
        var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var dbUser = await _context.Users.FindAsync(userId);
        if (dbUser == null) return NotFound();

        var userEmail = dbUser.Email ?? "user@talenhuman.com";

        var fidoUser = new Fido2User
        {
            DisplayName = dbUser.FullName ?? dbUser.UserName,
            Name = dbUser.UserName,
            Id = userId.ToByteArray()
        };

        var existingCredentials = _context.UserCredentials
            .Where(c => c.UserId == userId)
            .Select(c => new PublicKeyCredentialDescriptor(c.DescriptorId))
            .ToList();

        var authenticatorSelection = new AuthenticatorSelection
        {
            RequireResidentKey = true, // 🚀 SAFARI FIX: Mandatory for iOS 17+ signature validity
            UserVerification = UserVerificationRequirement.Preferred,
            AuthenticatorAttachment = AuthenticatorAttachment.Platform 
        };

        var options = _fido2.RequestNewCredential(fidoUser, existingCredentials, authenticatorSelection, AttestationConveyancePreference.None, null);

        // 🚀 PERSISTENT STORAGE IN DB (Bypass Session instability)
        dbUser.PendingFidoOptions = options.ToJson();
        await _context.SaveChangesAsync();

        return Content(options.ToJson(), "application/json");
    }

    [HttpPost("register/complete")]
    public async Task<IActionResult> RegisterComplete([FromBody] AuthenticatorAttestationRawResponse attestationResponse)
    {
        try
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString)) return Unauthorized();

            var userId = Guid.Parse(userIdString);
            var dbUser = await _context.Users.FindAsync(userId);
            if (dbUser == null) return NotFound();

            var jsonOptions = dbUser.PendingFidoOptions;
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

            // 🚀 CLEAR PENDING OPTIONS
            dbUser.PendingFidoOptions = null;
            
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
    public async Task<IActionResult> UpdateFirebaseToken([FromBody] TokenUpdateDto dto)
    {
        var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();

        var userId = Guid.Parse(userIdString);
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        user.FirebaseToken = dto.Token;
        await _context.SaveChangesAsync();

        await _auditService.LogAsync("FCM_SYNC", "User", userId.ToString(), $"Token actualizado para {user.UserName}: {dto.Token.Substring(0, Math.Min(10, dto.Token.Length))}...");

        return Ok(new { status = "success" });
    }

    public class TokenUpdateDto
    {
        public string Token { get; set; } = string.Empty;
    }

    [AllowAnonymous]
    [HttpPost("assertion/options")]
    public async Task<IActionResult> GetAssertionOptions([FromBody] AssertionRequest request)
    {
        var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email == request.Email || u.UserName == request.Email);
        if (user == null) return NotFound("Usuario no encontrado");

        var existingCredentials = await _context.UserCredentials
            .Where(c => c.UserId == user.Id)
            .Select(c => new PublicKeyCredentialDescriptor(c.DescriptorId))
            .ToListAsync();

        if (!existingCredentials.Any()) return BadRequest("No existe biometría vinculada a esta cuenta.");

        var options = _fido2.GetAssertionOptions(existingCredentials, UserVerificationRequirement.Preferred);
        
        user.PendingFidoOptions = options.ToJson();
        await _context.SaveChangesAsync();

        return Content(options.ToJson(), "application/json");
    }

    [AllowAnonymous]
    [HttpPost("assertion/complete")]
    public async Task<IActionResult> AssertionComplete([FromBody] AuthenticatorAssertionRawResponse assertionResponse)
    {
        try
        {
            var userHandle = assertionResponse.Response.UserHandle ?? Array.Empty<byte>();
            var userId = new Guid(userHandle);
            
            var user = await _userManager.Users
                .IgnoreQueryFilters()
                .Include(u => u.Company)
                .FirstOrDefaultAsync(u => u.Id == userId);
            
            if (user == null) return NotFound("Sesión inválida.");

            var jsonOptions = user.PendingFidoOptions;
            if (string.IsNullOrEmpty(jsonOptions)) return BadRequest("Sesión expirada.");

            var options = Fido2NetLib.AssertionOptions.FromJson(jsonOptions);

            var credential = await _context.UserCredentials.FirstOrDefaultAsync(c => c.DescriptorId == assertionResponse.Id);
            if (credential == null) return BadRequest("Credencial no reconocida.");

            var storedCredential = new StoredCredential
            {
                Descriptor = new PublicKeyCredentialDescriptor(credential.DescriptorId),
                PublicKey = credential.PublicKey,
                UserHandle = credential.UserHandle,
                SignatureCounter = credential.SignatureCounter
            };

            var success = await _fido2.MakeAssertionAsync(assertionResponse, options, storedCredential.PublicKey, storedCredential.SignatureCounter, (args, cancellationToken) =>
            {
                return Task.FromResult(true);
            });

            // Update counter
            credential.SignatureCounter = success.Counter;
            user.PendingFidoOptions = null;
            await _context.SaveChangesAsync();

            // 🚀 FULL JWT PAYLOAD (Matching AuthController.Login)
            var roles = await _userManager.GetRolesAsync(user);
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email!),
                new Claim("CompanyId", user.CompanyId.ToString())
            };
            foreach (var role in roles) claims.Add(new Claim(ClaimTypes.Role, role));

            var permissions = await _identityService.GetUserPermissionsAsync(user.Id);
            foreach (var perm in permissions) claims.Add(new Claim("perm", perm));

            var activeModules = await _context.CompanyModules
                .IgnoreQueryFilters()
                .Include(cm => cm.Module)
                .Where(cm => cm.CompanyId == user.CompanyId && cm.IsActive)
                .Select(cm => cm.Module!.Code)
                .ToListAsync();
            foreach (var mod in activeModules) claims.Add(new Claim("mod", mod));

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? "SuperSecretKey123!_TalenHuman_2026_Secure"));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: "TalenHuman",
                audience: "TalenHuman",
                claims: claims,
                expires: DateTime.Now.AddDays(7),
                signingCredentials: creds
            );

            // Fetch extra info (Stores, District)
            var employee = await _context.Employees
                .IgnoreQueryFilters()
                .Include(e => e.Store)
                .Include(e => e.Profile)
                .FirstOrDefaultAsync(e => e.Id == user.EmployeeId);

            Guid? storeId = employee?.StoreId;
            string? storeName = employee?.Store?.Name;
            string? storeExternalId = employee?.Store?.ExternalId;

            var managedDistricts = await _context.Districts.IgnoreQueryFilters().Where(d => d.SupervisorId == user.Id).ToListAsync();
            var storeIds = await _context.SupervisorStores.IgnoreQueryFilters().Where(ss => ss.UserId == user.Id).Select(ss => ss.StoreId).ToListAsync();
            
            var firebaseConfig = await _settingsService.GetGroupSettingsAsync("Firebase");

            await _auditService.LogAsync("LOGIN_BIOMETRIC", "Auth", user.Id.ToString(), "Acceso mediante biometría", true, user.Id, user.CompanyId, user.Email);

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
                    districtName = managedDistricts.FirstOrDefault()?.Name,
                    storeIds,
                    employeeId = user.EmployeeId,
                    joinDate = employee?.DateOfEntry,
                    jobTitle = employee?.Profile?.Name,
                    activeModules,
                    permissions,
                    firebaseApiKey = firebaseConfig.ContainsKey("FIREBASE_API_KEY") ? firebaseConfig["FIREBASE_API_KEY"] : null,
                    firebaseAuthDomain = firebaseConfig.ContainsKey("FIREBASE_AUTH_DOMAIN") ? firebaseConfig["FIREBASE_AUTH_DOMAIN"] : null,
                    firebaseProjectId = firebaseConfig.ContainsKey("FIREBASE_PROJECT_ID") ? firebaseConfig["FIREBASE_PROJECT_ID"] : null,
                    firebaseStorageBucket = firebaseConfig.ContainsKey("FIREBASE_STORAGE_BUCKET") ? firebaseConfig["FIREBASE_STORAGE_BUCKET"] : null,
                    firebaseMessagingSenderId = firebaseConfig.ContainsKey("FIREBASE_MESSAGING_SENDER_ID") ? firebaseConfig["FIREBASE_MESSAGING_SENDER_ID"] : null,
                    firebaseAppId = firebaseConfig.ContainsKey("FIREBASE_APP_ID") ? firebaseConfig["FIREBASE_APP_ID"] : null,
                    firebaseVapidKey = firebaseConfig.ContainsKey("FIREBASE_VAPID_KEY") ? firebaseConfig["FIREBASE_VAPID_KEY"] : null,
                    acceptedPrivacyPolicy = user.AcceptedPrivacyPolicy,
                    hasBiometrics = true
                }
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { status = "error", message = ex.Message });
        }
    }

    public class AssertionRequest { public string Email { get; set; } = string.Empty; }
    
    public class StoredCredential
    {
        public byte[] DescriptorId { get; set; } = Array.Empty<byte>();
        public byte[] PublicKey { get; set; } = Array.Empty<byte>();
        public byte[] UserHandle { get; set; } = Array.Empty<byte>();
        public uint SignatureCounter { get; set; }
        public PublicKeyCredentialDescriptor Descriptor { get; set; }
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
