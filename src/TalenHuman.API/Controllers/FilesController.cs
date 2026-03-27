using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TalenHuman.Application.Common.Interfaces;

namespace TalenHuman.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FilesController : ControllerBase
{
    private readonly IFileStorageService _storageService;

    public FilesController(IFileStorageService storageService)
    {
        _storageService = storageService;
    }

    [HttpPost("upload")]
    public async Task<ActionResult<UploadResponseDto>> Upload(IFormFile file, [FromQuery] string folder = "attachments")
    {
        if (file == null || file.Length == 0) return BadRequest("No file uploaded.");

        try
        {
            var url = await _storageService.UploadFileAsync(file, folder);
            return Ok(new UploadResponseDto { Url = url, FileName = file.FileName });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}

public class UploadResponseDto
{
    public string Url { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
}
