using FirebaseAdmin.Messaging;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;

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
    public string To { get; set; } = string.Empty; // Email or FirebaseToken
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; } = NotificationType.Email;
    public List<AttachmentDto>? Attachments { get; set; }
}

public class NotificationService
{
    private readonly IEmailService _emailService;
    private readonly IApplicationDbContext _context;

    public NotificationService(IEmailService emailService, IApplicationDbContext context)
    {
        _emailService = emailService;
        _context = context;
    }

    public async Task SendNotificationAsync(NotificationRequest request)
    {
        switch (request.Type)
        {
            case NotificationType.Email:
                await _emailService.SendEmailAsync(request.To, request.Subject, request.Message, request.Attachments);
                break;
            
            case NotificationType.Push:
                // For Push, 'To' can be the FirebaseToken directly
                if (string.IsNullOrEmpty(request.To)) return;

                try {
                    var message = new Message()
                    {
                        Token = request.To,
                        Notification = new Notification()
                        {
                            Title = request.Subject,
                            Body = request.Message
                        }
                    };
                    await FirebaseMessaging.DefaultInstance.SendAsync(message);
                } catch (Exception) {
                    // Suppress for now to avoid breaking the calling worker
                }
                break;

            default:
                throw new NotSupportedException($"Notification type {request.Type} not implemented yet.");
        }
    }
}
