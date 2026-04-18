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
        await SendBatchEmailAsync(new List<string> { to }, subject, body, attachments);
    }

    public async Task SendBatchEmailAsync(List<string> tos, string subject, string body, List<AttachmentDto>? attachments = null)
    {
        var apiKey = await _settingsService.GetSettingAsync("RESEND_API_KEY");
        var from = await _settingsService.GetSettingAsync("EMAIL_FROM") ?? "no-reply@resend.dev";

        if (string.IsNullOrEmpty(apiKey) || tos == null || !tos.Any()) return;

        // Resend Batch API allows up to 100 emails per request. 
        // For simplicity, if we have more, we could chunk them, but usually for HR/Distritales it will be < 100.
        // We will send ONE request with multiple 'emails' in the batch if requested or one multi-recipient email.
        
        // Strategy: Use the Batch endpoint for maximum efficiency
        var emails = tos.Select(recipient => new
        {
            from,
            to = new[] { recipient },
            subject,
            html = body,
            attachments = attachments?.Select(a => new {
                filename = a.Filename,
                content = Convert.ToBase64String(a.Content),
                content_type = a.ContentType // Resend supports explicit content-type (Optional but recommended for PDFs)
            }).ToList()
        }).ToList();

        // Logging for diagnostics
        if (attachments != null && attachments.Any())
        {
            var totalBytes = attachments.Sum(a => a.Content.Length);
            Console.WriteLine($"[RESEND] Sending email batch with {attachments.Count} attachments. Total size: {totalBytes / 1024.0:F2} KB");
        }

        // Execute with Polly retry policy
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
                Console.WriteLine($"[RESEND ERROR] Status: {response.StatusCode}. Details: {error}");
            }
            
            return response;
        });
    }
}
