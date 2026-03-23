using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Application.Common.Models;
using System.Text;

namespace TalenHuman.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ImportController : ControllerBase
{
    private readonly IImportService _importService;

    public ImportController(IImportService importService)
    {
        _importService = importService;
    }

    [HttpGet("template/{type}")]
    public async Task<IActionResult> GetTemplate(string type)
    {
        try 
        {
            var bytes = await _importService.GenerateTemplateAsync(type);
            var fileName = $"Plantilla_{type}_{DateTime.Now:yyyyMMdd}.xlsx";
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Error al generar plantilla: {ex.Message}" });
        }
    }

    [HttpPost("validate/{type}")]
    public async Task<ActionResult<ImportPreviewDto>> Validate(string type, IFormFile file)
    {
        try 
        {
            var result = await _importService.ValidateImportAsync(type, file);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Error al validar archivo: {ex.Message}" });
        }
    }

    [HttpPost("confirm/{type}")]
    public async Task<ActionResult<ImportResultDto>> Confirm(string type, [FromBody] List<ImportRowDto> rows)
    {
        try 
        {
            var result = await _importService.ExecuteImportAsync(type, rows);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Error al confirmar carga: {ex.Message}" });
        }
    }

    [HttpPost("brands")]
    public async Task<IActionResult> ImportBrands(IFormFile file)
    {
        var result = await _importService.ImportBrandsAsync(file);
        return Ok(new { result.Imported, result.Errors });
    }

    [HttpPost("stores")]
    public async Task<IActionResult> ImportStores(IFormFile file)
    {
        var result = await _importService.ImportStoresAsync(file);
        return Ok(new { result.Imported, result.Errors });
    }

    [HttpPost("profiles")]
    public async Task<IActionResult> ImportProfiles(IFormFile file)
    {
        var result = await _importService.ImportCargosAsync(file);
        return Ok(new { result.Imported, result.Errors });
    }

    [HttpPost("employees")]
    public async Task<IActionResult> ImportEmployees(IFormFile file)
    {
        var result = await _importService.ImportEmployeesAsync(file);
        return Ok(new { result.Imported, result.Errors });
    }
}
