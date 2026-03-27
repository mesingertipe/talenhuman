using Amazon.S3;
using Amazon.S3.Transfer;
using Microsoft.AspNetCore.Http;
using TalenHuman.Application.Common.Interfaces;

namespace TalenHuman.Infrastructure.Services;

public class DigitalOceanSpacesService : IFileStorageService
{
    private readonly ISystemSettingsService _settingsService;

    public DigitalOceanSpacesService(ISystemSettingsService settingsService)
    {
        _settingsService = settingsService;
    }

    private async Task<AmazonS3Client> GetClientAsync()
    {
        var accessKey = await _settingsService.GetSettingAsync("DO_ACCESS_KEY");
        var secretKey = await _settingsService.GetSettingAsync("DO_SECRET_KEY");
        var endpoint = await _settingsService.GetSettingAsync("DO_ENDPOINT");

        if (string.IsNullOrEmpty(accessKey) || string.IsNullOrEmpty(secretKey) || string.IsNullOrEmpty(endpoint))
        {
            throw new Exception("DigitalOcean Spaces is not configured. Please check System Settings.");
        }

        var config = new AmazonS3Config { ServiceURL = endpoint };
        return new AmazonS3Client(accessKey, secretKey, config);
    }

    public async Task<string> UploadFileAsync(IFormFile file, string folder = "attachments")
    {
        var bucketName = await _settingsService.GetSettingAsync("DO_BUCKET_NAME");
        if (string.IsNullOrEmpty(bucketName)) throw new Exception("Bucket name not configured.");

        using var client = await GetClientAsync();
        var fileTransferUtility = new TransferUtility(client);

        var fileExtension = Path.GetExtension(file.FileName);
        var fileName = $"{Guid.NewGuid()}{fileExtension}";
        var key = $"{folder}/{fileName}";

        using var stream = file.OpenReadStream();
        
        var uploadRequest = new TransferUtilityUploadRequest
        {
            InputStream = stream,
            Key = key,
            BucketName = bucketName,
            CannedACL = S3CannedACL.PublicRead
        };

        await fileTransferUtility.UploadAsync(uploadRequest);

        // Construct public URL
        var endpoint = await _settingsService.GetSettingAsync("DO_ENDPOINT");
        var cleanEndpoint = endpoint?.Replace("https://", "");
        return $"https://{bucketName}.{cleanEndpoint}/{key}";
    }

    public async Task DeleteFileAsync(string fileUrl)
    {
        // Parsing the key from URL might be needed if we want to support deletion
        // For now, focusing on upload
    }
}
