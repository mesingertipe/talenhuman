using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;

namespace TalenHuman.API.Controllers;

[Authorize(Roles = "SuperAdmin,Admin,RH")]
[ApiController]
[Route("api/[controller]")]
public class SystemSettingsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ISystemSettingsService _settingsService;

    public SystemSettingsController(IApplicationDbContext context, ISystemSettingsService settingsService)
    {
        _context = context;
        _settingsService = settingsService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SystemSetting>>> GetSettings()
    {
        return Ok(await _settingsService.GetMergedSettingsAsync());
    }


    [HttpGet("group/{group}")]
    public async Task<ActionResult<IDictionary<string, string>>> GetGroupSettings(string group)
    {
        return Ok(await _settingsService.GetGroupSettingsAsync(group));
    }

    [HttpPost]
    public async Task<IActionResult> SaveSetting(SaveSettingDto dto)
    {
        await _settingsService.SetSettingAsync(dto.Key, dto.Value, dto.Group, dto.Description, isGlobal: true);
        return Ok();
    }

    [HttpPost("batch")]
    public async Task<IActionResult> SaveSettings(IEnumerable<SaveSettingDto> settings)
    {
        foreach (var s in settings)
        {
            await _settingsService.SetSettingAsync(s.Key, s.Value, s.Group, s.Description, isGlobal: true);
        }
        return Ok();
    }

    private class CustomHttpClientFactory : Amazon.Runtime.HttpClientFactory
    {
        public override HttpClient CreateHttpClient(Amazon.Runtime.IClientConfig config)
        {
            var handler = new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = (message, cert, chain, errors) => true
            };
            return new HttpClient(handler);
        }
    }

    [HttpPost("test/storage")]
    public async Task<IActionResult> TestStorage([FromBody] TalenHuman.API.Models.TestStorageRequest req)
    {
        try
        {
            if (string.IsNullOrEmpty(req.Endpoint) || string.IsNullOrEmpty(req.AccessKey) || string.IsNullOrEmpty(req.SecretKey))
                return BadRequest(new { success = false, message = "Faltan datos requeridos (Endpoint, Access Key, Secret Key)." });

            var config = new Amazon.S3.AmazonS3Config 
            { 
                ServiceURL = req.Endpoint,
                HttpClientFactory = new CustomHttpClientFactory()
            };
            using var client = new Amazon.S3.AmazonS3Client(req.AccessKey, req.SecretKey, config);
            var response = await client.ListObjectsV2Async(new Amazon.S3.Model.ListObjectsV2Request
            {
                BucketName = req.BucketName ?? "",
                MaxKeys = 1
            });
            return Ok(new { success = true, message = "Conexión S3 establecida. Bucket validado con éxito." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = $"Error de Storage: {ex.Message}" });
        }
    }

    [HttpPost("test/email")]
    public async Task<IActionResult> TestEmail([FromBody] TalenHuman.API.Models.TestEmailRequest req)
    {
        try
        {
            if (string.IsNullOrEmpty(req.ResendApiKey) || string.IsNullOrEmpty(req.FromEmail))
                return BadRequest(new { success = false, message = "Faltan datos requeridos (API Key, From Email)." });

            var currentUserEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(currentUserEmail)) return BadRequest(new { success = false, message = "No se pudo obtener el correo del usuario actual para enviar la prueba." });

            var handler = new HttpClientHandler { ServerCertificateCustomValidationCallback = (sender, cert, chain, sslPolicyErrors) => true };
            using var httpClient = new HttpClient(handler);
            httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", req.ResendApiKey);

            var emailData = new
            {
                from = req.FromEmail,
                to = new[] { currentUserEmail },
                subject = "TalenHuman - Prueba de Conexión de Correo",
                html = "<h3>¡Conexión Exitosa!</h3><p>Tus credenciales de Resend están funcionando correctamente en TalenHuman.</p>"
            };

            var json = System.Text.Json.JsonSerializer.Serialize(emailData);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await httpClient.PostAsync("https://api.resend.com/emails", content);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                return BadRequest(new { success = false, message = $"Resend rechazó el envío: {responseBody}" });
            }

            return Ok(new { success = true, message = $"Correo de prueba enviado con éxito a {currentUserEmail}." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = $"Error de Email: {ex.Message}" });
        }
    }

    [HttpPost("test/firebase")]
    public IActionResult TestFirebase([FromBody] TalenHuman.API.Models.TestFirebaseRequest req)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(req.ServiceAccountJson))
                return BadRequest(new { success = false, message = "El JSON de Firebase está vacío." });

            var credential = Google.Apis.Auth.OAuth2.GoogleCredential.FromJson(req.ServiceAccountJson);
            
            // Just verifying it parses properly
            if (credential == null)
                return BadRequest(new { success = false, message = "No se pudo crear la credencial de Google." });

            return Ok(new { success = true, message = "JSON de Firebase validado correctamente. SDK listo para inicializar." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = $"JSON inválido o credencial corrupta: {ex.Message}" });
        }
    }

    [HttpPost("test/ai")]
    public async Task<IActionResult> TestAi([FromBody] TalenHuman.API.Models.TestAiRequest req)
    {
        try
        {
            if (string.IsNullOrEmpty(req.ApiKey))
                return BadRequest(new { success = false, message = "Falta la clave API de Gemini." });

            var handler = new HttpClientHandler { ServerCertificateCustomValidationCallback = (sender, cert, chain, sslPolicyErrors) => true };
            using var httpClient = new HttpClient(handler);
            var requestBody = new
            {
                contents = new[] { new { role = "user", parts = new[] { new { text = "Responde únicamente con la palabra 'OK'." } } } }
            };

            var json = System.Text.Json.JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            string modelToUse = !string.IsNullOrEmpty(req.Model) ? req.Model : "gemini-1.5-flash";
            var response = await httpClient.PostAsync($"https://generativelanguage.googleapis.com/v1beta/models/{modelToUse}:generateContent?key={req.ApiKey}", content);
            
            if (!response.IsSuccessStatusCode) 
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                return BadRequest(new { success = false, message = $"Error de la IA: {response.StatusCode} - {errorBody}" });
            }

            return Ok(new { success = true, message = "Conexión a Gemini establecida correctamente." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = $"Error de Inteligencia Artificial: {ex.Message}" });
        }
    }
}

public class SaveSettingDto
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Group { get; set; } = "General";
    public string? Description { get; set; }
}
