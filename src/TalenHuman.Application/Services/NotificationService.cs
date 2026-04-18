using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;
using System.Net;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;

namespace TalenHuman.Application.Services;

public enum NotificationType
{
    Email,
    WhatsApp, // Placeholder for future
    SMS,      // Placeholder for future
    Push
}

public class NotificationRequest
{
    public string? To { get; set; } // Email or FirebaseToken
    public Guid? UserId { get; set; } // Target user ID for persistent history
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; } = NotificationType.Email;
    public string Category { get; set; } = "system"; // broadcast, shift_reminder, alert
    public Dictionary<string, string>? Metadata { get; set; } // Deep linking data (comunicadoId, etc)
    public List<AttachmentDto>? Attachments { get; set; }
}

public class NotificationService
{
    private static readonly System.Threading.SemaphoreSlim _semaphore = new System.Threading.SemaphoreSlim(1, 1);
    private readonly IEmailService _emailService;
    private readonly IApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;
    private readonly ISystemSettingsService _settingsService;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        IEmailService emailService, 
        IApplicationDbContext context,
        ITenantProvider tenantProvider,
        ISystemSettingsService settingsService,
        ILogger<NotificationService> logger)
    {
        _emailService = emailService;
        _context = context;
        _tenantProvider = tenantProvider;
        _settingsService = settingsService;
        _logger = logger;
    }

    public static string SanitizePushText(string text)
    {
        if (string.IsNullOrEmpty(text)) return string.Empty;
        
        // 1. Decode HTML entities (&amp; -> &, &quot; -> ", etc.)
        var decoded = WebUtility.HtmlDecode(text);
        
        // 2. Remove all HTML tags (including attributes like src for images)
        var noHtml = Regex.Replace(decoded, "<[^>]*>", string.Empty);
        
        // 3. Remove newlines and carriage returns
        var noNewLines = noHtml.Replace("\n", " ").Replace("\r", " ").Replace("\\n", " ").Replace("\\r", " ");
        
        // 4. Shrink multiple spaces and trim
        var clean = Regex.Replace(noNewLines, @"\s+", " ").Trim();
        
        return clean;
    }

    public static string? ExtractFirstImageUrl(string html)
    {
        if (string.IsNullOrEmpty(html)) return null;
        var match = Regex.Match(html, "<img.+?src=[\"'](.+?)[\"'].*?>", RegexOptions.IgnoreCase);
        return match.Success ? match.Groups[1].Value : null;
    }

    private async Task<FirebaseMessaging> GetMessagingAsync()
    {
        var tenantId = _tenantProvider.GetTenantId();
        var projectId = await _settingsService.GetSettingAsync("FIREBASE_PROJECT_ID") ?? "talenhuman";
        var senderId = await _settingsService.GetSettingAsync("FIREBASE_MESSAGING_SENDER_ID") ?? "---";

        _logger.LogInformation("🔍 [FCM-STEP-0] Resolviendo instancia para Tenant: {TenantId}. Project: {ProjectId}. Sender: {SenderId}", 
            tenantId, projectId, senderId);

        // 🛡️ ELITE V12.33: Prioritize DefaultInstance if ProjectId matches 
        // This ensures maximum compatibility with Environment-level credentials
        if (FirebaseApp.DefaultInstance != null && FirebaseApp.DefaultInstance.Options.ProjectId == projectId)
        {
            _logger.LogTrace("🎯 [FCM] Using DefaultInstance for {ProjectId}", projectId);
            return FirebaseMessaging.DefaultInstance;
        }

        var appName = $"App_{projectId}";
        var app = FirebaseApp.GetInstance(appName);
        
        if (app == null)
        {
            await _semaphore.WaitAsync();
            try
            {
                app = FirebaseApp.GetInstance(appName);
                if (app == null)
                {
                    _logger.LogInformation("🚀 [FCM] Initializing Named Instance: {ProjectId} (Sender: {SenderId})", projectId, senderId);
                    
                    var sAccountJson = await _settingsService.GetSettingAsync("FIREBASE_S_ACCOUNT");
                    var credential = !string.IsNullOrEmpty(sAccountJson)
                        ? Google.Apis.Auth.OAuth2.GoogleCredential.FromJson(sAccountJson)
                        : Google.Apis.Auth.OAuth2.GoogleCredential.GetApplicationDefault();

                    app = FirebaseApp.Create(new AppOptions
                    {
                        ProjectId = projectId,
                        Credential = credential,
                    }, appName);
                }
            }
            finally
            {
                _semaphore.Release();
            }
        }

        return FirebaseMessaging.GetMessaging(app);
    }

    public async Task<string?> SendNotificationAsync(NotificationRequest request)
    {
        string? messageId = null;
        // 1. Database Logging (Persistent History)
        if (request.UserId.HasValue && request.UserId != Guid.Empty)
        {
            var log = new NotificationLog
            {
                UserId = request.UserId.Value,
                Title = request.Subject,
                Body = SanitizePushText(request.Message),
                Type = request.Category,
                IsRead = false,
                CompanyId = _tenantProvider.GetTenantId(),
                MetadataJson = request.Metadata != null ? System.Text.Json.JsonSerializer.Serialize(request.Metadata) : null
            };

            _context.NotificationLogs.Add(log);
            await _context.SaveChangesAsync(CancellationToken.None);
            
            // If token not provided, try to fetch it from the user
            if (string.IsNullOrEmpty(request.To) && request.Type == NotificationType.Push)
            {
                var user = await _context.Users.FindAsync(request.UserId.Value);
                request.To = user?.FirebaseToken;
            }
        }

        // 2. Physical Delivery
        switch (request.Type)
        {
            case NotificationType.Email:
                if (!string.IsNullOrEmpty(request.To))
                {
                    await _emailService.SendEmailAsync(request.To, request.Subject, request.Message, request.Attachments);
                    messageId = "email_sent";
                }
                break;
            
            case NotificationType.Push:
                if (string.IsNullOrEmpty(request.To)) return null;

                try {
                    var data = request.Metadata != null 
                        ? new Dictionary<string, string>(request.Metadata) 
                        : new Dictionary<string, string>();

                    // Ensure basic info is always in Data for the Service Worker
                    var sanitizedTitle = SanitizePushText(request.Subject);
                    var sanitizedBody = SanitizePushText(request.Message);

                    data["title"] = sanitizedTitle;
                    data["body"] = sanitizedBody;
                    data["category"] = request.Category;

                    var fcmMessage = new Message()
                    {
                        Token = request.To,
                        Data = data
                    };

                    var messaging = await GetMessagingAsync();
                    
                    _logger.LogInformation("⏳ [FCM-STEP-1] Intentando envío a Google FCM (Token: {TokenPrefix}...) Project: {Project}", 
                        request.To.Length > 10 ? request.To.Substring(0, 10) : "short", 
                        (await GetMessagingAsync()).GetType().Name); // Logging the instance type

                    messageId = await messaging.SendAsync(fcmMessage);
                    
                    _logger.LogInformation("✅ [V12.60-FCM-STEP-2] Respuesta de Google FCM: {ResponseID}. Usuario: {UserId}", 
                        messageId, request.UserId);
                } catch (Exception ex) {
                    _logger.LogError(ex, "FCM Error sending notification to user {UserId}: {Message}", request.UserId, ex.Message);
                    throw; // Re-throw to allow controller to catch it
                }
                break;

            default:
                throw new NotSupportedException($"Notification type {request.Type} not implemented yet.");
        }

        return messageId;
    }

    public async Task SendBroadcastAsync(IEnumerable<Guid> userIds, IEnumerable<string> tokens, NotificationRequest request)
    {
        // 1. Bulk Database Logging
        var companyId = _tenantProvider.GetTenantId();
        var metadataJson = request.Metadata != null ? System.Text.Json.JsonSerializer.Serialize(request.Metadata) : null;
        
        var logs = userIds.Select(uid => new NotificationLog
        {
            UserId = uid,
            Title = request.Subject,
            Body = SanitizePushText(request.Message),
            Type = request.Category,
            IsRead = false,
            CompanyId = companyId,
            MetadataJson = metadataJson
        }).ToList();

        _context.NotificationLogs.AddRange(logs);
        await _context.SaveChangesAsync(CancellationToken.None);

        // 2. Multicast FCM Delivery
        var activeTokens = tokens.Where(t => !string.IsNullOrEmpty(t)).Distinct().ToList();
        if (!activeTokens.Any()) return;

        try 
        {
            var data = request.Metadata != null 
                ? new Dictionary<string, string>(request.Metadata) 
                : new Dictionary<string, string>();

            // Ensure basic info in Data
            var sanitizedTitle = SanitizePushText(request.Subject);
            var sanitizedBody = SanitizePushText(request.Message);

            data["title"] = sanitizedTitle;
            data["body"] = sanitizedBody;
            data["category"] = request.Category;

            var multicastMessage = new MulticastMessage()
            {
                Tokens = activeTokens,
                Notification = new FirebaseAdmin.Messaging.Notification()
                {
                    Title = sanitizedTitle,
                    Body = sanitizedBody,
                    ImageUrl = ExtractFirstImageUrl(request.Message)
                },
                Data = data
            };

            var messaging = await GetMessagingAsync();
            await messaging.SendEachForMulticastAsync(multicastMessage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "FCM Broadcast Error: {Message}", ex.Message);
        }
    }
    public async Task SendBatchEmailNotificationAsync(IEnumerable<string> emails, NotificationRequest request)
    {
        var activeEmails = emails.Where(e => !string.IsNullOrEmpty(e)).Distinct().ToList();
        if (!activeEmails.Any()) return;

        // Since we are sending an administrative notification (Approval/Rejection), 
        // we use the batch capability of the infrastructure service.
        await _emailService.SendBatchEmailAsync(activeEmails, request.Subject, request.Message, request.Attachments);
        
        _logger.LogInformation("📧 [BATCH-EMAIL] Notification sent to {Count} recipients. Subject: {Subject}", activeEmails.Count, request.Subject);
    }
}
