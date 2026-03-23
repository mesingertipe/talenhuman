using Microsoft.AspNetCore.Http;
using TalenHuman.Application.Common.Models;

namespace TalenHuman.Application.Common.Interfaces;

public interface IImportService
{
    Task<byte[]> GenerateTemplateAsync(string type);
    Task<ImportPreviewDto> ValidateImportAsync(string type, IFormFile file);
    Task<ImportResultDto> ExecuteImportAsync(string type, List<ImportRowDto> rows);

    // Old methods (keeping for backward compatibility or refactoring later)
    Task<(int Imported, List<string> Errors)> ImportBrandsAsync(IFormFile file);
    Task<(int Imported, List<string> Errors)> ImportStoresAsync(IFormFile file);
    Task<(int Imported, List<string> Errors)> ImportCargosAsync(IFormFile file);
    Task<(int Imported, List<string> Errors)> ImportEmployeesAsync(IFormFile file);
}
