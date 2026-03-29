namespace TalenHuman.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body, List<AttachmentDto>? attachments = null);
}

public class AttachmentDto
{
    public string Filename { get; set; } = string.Empty;
    public byte[] Content { get; set; } = Array.Empty<byte>(); // Raw binary content
    public string? ContentType { get; set; }
}
