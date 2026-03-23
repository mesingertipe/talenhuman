using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TalenHuman.Application.Common.Interfaces;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImportsController : ControllerBase
{
    private readonly IImportService _importService;

    public ImportsController(IImportService importService)
    {
        _importService = importService;
    }

    [HttpPost("brands")]
    public async Task<IActionResult> ImportBrands(IFormFile file)
    {
        var result = await _importService.ImportBrandsAsync(file);
        return Ok(result);
    }

    [HttpPost("stores")]
    public async Task<IActionResult> ImportStores(IFormFile file)
    {
        var result = await _importService.ImportStoresAsync(file);
        return Ok(result);
    }

    [HttpPost("cargos")]
    public async Task<IActionResult> ImportCargos(IFormFile file)
    {
        var result = await _importService.ImportCargosAsync(file);
        return Ok(result);
    }

    [HttpPost("employees")]
    public async Task<IActionResult> ImportEmployees(IFormFile file)
    {
        var result = await _importService.ImportEmployeesAsync(file);
        return Ok(result);
    }
}
