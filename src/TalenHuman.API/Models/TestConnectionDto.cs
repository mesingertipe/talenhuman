namespace TalenHuman.API.Models;

public class TestStorageRequest
{
    public string? BucketName { get; set; }
    public string? Endpoint { get; set; }
    public string? AccessKey { get; set; }
    public string? SecretKey { get; set; }
}

public class TestEmailRequest
{
    public string? ResendApiKey { get; set; }
    public string? FromEmail { get; set; }
}

public class TestFirebaseRequest
{
    public string? ServiceAccountJson { get; set; }
}

public class TestAiRequest
{
    public string? ApiKey { get; set; }
    public string? Model { get; set; }
}
