using TalenHuman.Application.Common.Interfaces;

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
    public string To { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; } = NotificationType.Email;
    public List<AttachmentDto>? Attachments { get; set; }
}

public class NotificationService
{
    private readonly IEmailService _emailService;

    public NotificationService(IEmailService emailService)
    {
        _emailService = emailService;
    }

    public async Task SendNotificationAsync(NotificationRequest request)
    {
        switch (request.Type)
        {
            case NotificationType.Email:
                await _emailService.SendEmailAsync(request.To, request.Subject, request.Message, request.Attachments);
                break;
            // Case WhatsApp: implementation here later
            default:
                throw new NotSupportedException($"Notification type {request.Type} not implemented yet.");
        }
    }
}
