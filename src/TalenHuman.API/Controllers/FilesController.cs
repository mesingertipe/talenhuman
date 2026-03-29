using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using TalenHuman.Application.Common.Interfaces;

namespace TalenHuman.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FilesController : ControllerBase
{
    private readonly IFileStorageService _storageService;
    private readonly IApplicationDbContext _context;

    public FilesController(IFileStorageService storageService, IApplicationDbContext context)
    {
        _storageService = storageService;
        _context = context;
    }

    [HttpGet("view/{id}")]
    public async Task<IActionResult> ViewFile(Guid id)
    {
        // Multitenancy: The global query filter automatically ensures 
        // that the user can only access files belonging to their CompanyId.
        var adjunto = await _context.NovedadAdjuntos.FindAsync(id);
        if (adjunto == null) return NotFound("Archivo no encontrado o acceso denegado.");

        try
        {
            (Stream stream, string contentType, string fileName) = await _storageService.GetFileStreamAsync(adjunto.Url);
            return File(stream, contentType, fileName);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = "No se pudo recuperar el archivo del almacenamiento externo.", Detail = ex.Message });
        }
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
