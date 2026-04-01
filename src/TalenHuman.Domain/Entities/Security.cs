using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TalenHuman.Domain.Entities;

public class UserCredential
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [ForeignKey("UserId")]
    public User? User { get; set; }

    public byte[] DescriptorId { get; set; } = Array.Empty<byte>();
    public byte[] PublicKey { get; set; } = Array.Empty<byte>();
    public byte[] UserHandle { get; set; } = Array.Empty<byte>();
    public uint SignatureCounter { get; set; }
    public string CredType { get; set; } = "public-key";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Friendly name for the device (e.g., "iPhone 15", "Chrome on Windows")
    public string? DeviceName { get; set; }
}
