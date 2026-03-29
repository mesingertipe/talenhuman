using System.Net.Http.Json;
using TalenHuman.Application.Common.Interfaces;

namespace TalenHuman.Infrastructure.Services;

public class ResendEmailService : IEmailService
{
    private readonly ISystemSettingsService _settingsService;
    private readonly HttpClient _httpClient;

    public ResendEmailService(ISystemSettingsService settingsService, HttpClient httpClient)
    {
        _settingsService = settingsService;
        _httpClient = httpClient;
    }

    public async Task SendEmailAsync(string to, string subject, string body, List<AttachmentDto>? attachments = null)
    {
        var apiKey = await _settingsService.GetSettingAsync("RESEND_API_KEY");
        var from = await _settingsService.GetSettingAsync("EMAIL_FROM") ?? "no-reply@resend.dev";

        if (string.IsNullOrEmpty(apiKey)) return; // Or log error

        var requestBody = new
        {
            from,
            to = new[] { to },
            subject,
            html = body,
            attachments = attachments?.Select(a => new {
                filename = a.Filename,
                content = Convert.ToBase64String(a.Content)
            }).ToList()
        };

        var httpRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails")
        {
            Content = JsonContent.Create(requestBody)
        };
        httpRequest.Headers.Add("Authorization", $"Bearer {apiKey}");

        await _httpClient.SendAsync(httpRequest);
    }
}
