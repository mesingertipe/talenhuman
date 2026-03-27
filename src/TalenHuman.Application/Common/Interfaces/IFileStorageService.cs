using Microsoft.AspNetCore.Http;

namespace TalenHuman.Application.Common.Interfaces;

public interface IFileStorageService
{
    Task<string> UploadFileAsync(IFormFile file, string folder = "attachments");
    Task DeleteFileAsync(string fileUrl);
}
