using FirebaseAdmin.Messaging;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;
using System.Net;
using System.Text.RegularExpressions;

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
    private readonly IEmailService _emailService;
    private readonly IApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public NotificationService(
        IEmailService emailService, 
        IApplicationDbContext context,
        ITenantProvider tenantProvider)
    {
        _emailService = emailService;
        _context = context;
        _tenantProvider = tenantProvider;
    }

    private string SanitizePushText(string text)
    {
        if (string.IsNullOrEmpty(text)) return string.Empty;
        
        // 1. Decode HTML entities (&amp; -> &, &quot; -> ", etc.)
        var decoded = WebUtility.HtmlDecode(text);
        
        // 2. Remove HTML tags if any residual exist
        var noHtml = Regex.Replace(decoded, "<.*?>", string.Empty);
        
        // 3. Remove newlines and carriage returns (replace with space)
        var noNewLines = noHtml.Replace("\n", " ").Replace("\r", " ");
        
        // 4. Shrink multiple spaces into one
        var clean = Regex.Replace(noNewLines, @"\s+", " ").Trim();
        
        return clean;
    }

    public async Task SendNotificationAsync(NotificationRequest request)
    {
        // 1. Database Logging (Persistent History)
        if (request.UserId.HasValue && request.UserId != Guid.Empty)
        {
            var log = new NotificationLog
            {
                UserId = request.UserId.Value,
                Title = request.Subject,
                Body = request.Message,
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
                }
                break;
            
            case NotificationType.Push:
                if (string.IsNullOrEmpty(request.To)) return;

                try {
                    var data = request.Metadata != null 
                        ? new Dictionary<string, string>(request.Metadata) 
                        : new Dictionary<string, string>();

                    // Ensure basic info is always in Data for the Service Worker
                    data["title"] = request.Subject;
                    var sanitizedBody = SanitizePushText(request.Message);

                    var fcmMessage = new Message()
                    {
                        Token = request.To,
                        Notification = new FirebaseAdmin.Messaging.Notification()
                        {
                            Title = request.Subject,
                            Body = sanitizedBody
                        },
                        Data = data
                    };
                    data["body"] = sanitizedBody;

                    await FirebaseMessaging.DefaultInstance.SendAsync(fcmMessage);
                } catch (Exception) {
                    // Suppress to avoid breaking background processes
                }
                break;

            default:
                throw new NotSupportedException($"Notification type {request.Type} not implemented yet.");
        }
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
            Body = request.Message,
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
            data["title"] = request.Subject;
            var sanitizedBody = SanitizePushText(request.Message);

            var multicastMessage = new MulticastMessage()
            {
                Tokens = activeTokens,
                Notification = new FirebaseAdmin.Messaging.Notification()
                {
                    Title = request.Subject,
                    Body = sanitizedBody
                },
                Data = data
            };
            data["body"] = sanitizedBody;

            await FirebaseMessaging.DefaultInstance.SendEachForMulticastAsync(multicastMessage);
        }
        catch (Exception)
        {
            // Suppress background errors
        }
    }
}
