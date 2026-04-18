using System.Net;
using System.Net.Http.Json;
using Polly;
using Polly.Retry;
using TalenHuman.Application.Common.Interfaces;

namespace TalenHuman.Infrastructure.Services;

public class ResendEmailService : IEmailService
{
    private readonly ISystemSettingsService _settingsService;
    private readonly HttpClient _httpClient;
    private readonly AsyncRetryPolicy<HttpResponseMessage> _retryPolicy;

    public ResendEmailService(ISystemSettingsService settingsService, HttpClient httpClient)
    {
        _settingsService = settingsService;
        _httpClient = httpClient;

        // Exponential Backoff Policy: Retry on 429 (Too Many Requests) or 5xx (Server Error)
        _retryPolicy = Policy
            .HandleResult<HttpResponseMessage>(r => r.StatusCode == (HttpStatusCode)429 || (int)r.StatusCode >= 500)
            .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));
    }

    public async Task SendEmailAsync(string to, string subject, string body, List<AttachmentDto>? attachments = null)
    {
        // For single emails with attachments, we use the standard endpoint directly
        if (attachments != null && attachments.Any())
        {
            await SendSingleEmailAsync(to, subject, body, attachments);
        }
        else
        {
            await SendBatchEmailAsync(new List<string> { to }, subject, body, attachments);
        }
    }

    private async Task SendSingleEmailAsync(string to, string subject, string body, List<AttachmentDto>? attachments)
    {
        var apiKey = await _settingsService.GetSettingAsync("RESEND_API_KEY");
        var from = await _settingsService.GetSettingAsync("EMAIL_FROM") ?? "no-reply@resend.dev";

        if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(to)) return;

        var emailPayload = new
        {
            from,
            to = new[] { to },
            subject,
            html = body,
            attachments = attachments?.Select(a => new {
                filename = a.Filename,
                content = Convert.ToBase64String(a.Content),
                content_type = a.ContentType
            }).ToList()
        };

        await _retryPolicy.ExecuteAsync(async () => {
            var httpRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails")
            {
                Content = JsonContent.Create(emailPayload)
            };
            httpRequest.Headers.Add("Authorization", $"Bearer {apiKey}");
            var response = await _httpClient.SendAsync(httpRequest);
            
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"[RESEND SINGLE ERROR] Status: {response.StatusCode}. Details: {error}");
            }
            return response;
        });
    }

    public async Task SendBatchEmailAsync(List<string> tos, string subject, string body, List<AttachmentDto>? attachments = null)
    {
        if (tos == null || !tos.Any()) return;

        // CRITICAL: Resend Batch API does NOT support attachments.
        // If we have attachments, we must iterate and send individually.
        if (attachments != null && attachments.Any())
        {
            Console.WriteLine($"[RESEND] Batch has attachments. Redirecting to individual sends for {tos.Count} recipients.");
            foreach (var to in tos)
            {
                await SendSingleEmailAsync(to, subject, body, attachments);
            }
            return;
        }

        var apiKey = await _settingsService.GetSettingAsync("RESEND_API_KEY");
        var from = await _settingsService.GetSettingAsync("EMAIL_FROM") ?? "no-reply@resend.dev";

        if (string.IsNullOrEmpty(apiKey)) return;

        var emails = tos.Select(recipient => new
        {
            from,
            to = new[] { recipient },
            subject,
            html = body
        }).ToList();

        await _retryPolicy.ExecuteAsync(async () => {
            var httpRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails/batch")
            {
                Content = JsonContent.Create(emails)
            };
            httpRequest.Headers.Add("Authorization", $"Bearer {apiKey}");
            var response = await _httpClient.SendAsync(httpRequest);
            
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"[RESEND BATCH ERROR] Status: {response.StatusCode}. Details: {error}");
            }
            return response;
        });
    }
}
