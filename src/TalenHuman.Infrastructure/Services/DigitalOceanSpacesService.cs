using Amazon.S3;
using Amazon.S3.Transfer;
using Microsoft.AspNetCore.Http;
using TalenHuman.Application.Common.Interfaces;

using Amazon.S3.Model;

namespace TalenHuman.Infrastructure.Services;

public class DigitalOceanSpacesService : IFileStorageService
{
    private readonly ISystemSettingsService _settingsService;
    private readonly ITenantProvider _tenantProvider;

    public DigitalOceanSpacesService(ISystemSettingsService settingsService, ITenantProvider tenantProvider)
    {
        _settingsService = settingsService;
        _tenantProvider = tenantProvider;
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

        var config = new AmazonS3Config 
        { 
            ServiceURL = endpoint,
            HttpClientFactory = new CustomHttpClientFactory()
        };
        return new AmazonS3Client(accessKey, secretKey, config);
    }

    // Elite V12 SSL Bypass: Required for certain Docker/On-Prem environments with trust store issues
    private class CustomHttpClientFactory : Amazon.Runtime.HttpClientFactory
    {
        public override HttpClient CreateHttpClient(Amazon.Runtime.IClientConfig config)
        {
            var handler = new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = (message, cert, chain, errors) => true
            };
            return new HttpClient(handler);
        }
    }

    public async Task<string> UploadFileAsync(IFormFile file, string folder = "attachments")
    {
        var bucketName = await _settingsService.GetSettingAsync("DO_BUCKET_NAME");
        if (string.IsNullOrEmpty(bucketName)) throw new Exception("Bucket name not configured.");

        var fileExtension = Path.GetExtension(file.FileName);
        
        // Elite V12 Compression: Process image before upload
        using var originalStream = file.OpenReadStream();
        Stream uploadStream = originalStream;
        bool isProcessed = false;

        if (file.ContentType.StartsWith("image/") && !file.ContentType.Contains("gif") && !file.ContentType.Contains("svg"))
        {
            uploadStream = await ImageProcessor.ProcessImageAsync(originalStream, file.ContentType);
            fileExtension = ".jpg"; // ImageProcessor always saves as JPEG
            isProcessed = true;
        }

        var fileName = $"{Guid.NewGuid()}{fileExtension}";
        var tenantId = _tenantProvider.GetTenantId();
        var key = $"{tenantId}/{folder}/{fileName}";

        using var client = await GetClientAsync();
        var fileTransferUtility = new TransferUtility(client);

        var uploadRequest = new TransferUtilityUploadRequest
        {
            InputStream = uploadStream,
            Key = key,
            BucketName = bucketName,
            CannedACL = S3CannedACL.Private,
            ContentType = isProcessed ? "image/jpeg" : file.ContentType
        };

        // Add metadata for easier identification
        uploadRequest.Metadata.Add("x-amz-meta-original-name", file.FileName);
        uploadRequest.Metadata.Add("x-amz-meta-tenant-id", tenantId.ToString());
        if (isProcessed) uploadRequest.Metadata.Add("x-amz-meta-processed", "true");

        await fileTransferUtility.UploadAsync(uploadRequest);

        // Disponer el MemoryStream si fue procesado
        if (isProcessed) await uploadStream.DisposeAsync();

        // We return the Key (path) instead of the full URL for security
        return key;
    }

    public async Task<(Stream Stream, string ContentType, string FileName)> GetFileStreamAsync(string fileKey)
    {
        var bucketName = await _settingsService.GetSettingAsync("DO_BUCKET_NAME");
        using var client = await GetClientAsync();

        var request = new GetObjectRequest
        {
            BucketName = bucketName,
            Key = fileKey
        };

        var response = await client.GetObjectAsync(request);
        
        var fileName = response.Metadata["x-amz-meta-original-name"] ?? Path.GetFileName(fileKey);
        
        return (response.ResponseStream, response.Headers.ContentType, fileName);
    }

    public async Task DeleteFileAsync(string fileUrl)
    {
        // Parsing the key from URL might be needed if we want to support deletion
        // For now, focusing on upload
    }
}
