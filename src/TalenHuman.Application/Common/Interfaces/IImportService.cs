using Microsoft.AspNetCore.Http;

namespace TalenHuman.Application.Common.Interfaces;

public interface IImportService
{
    Task<(int Imported, List<string> Errors)> ImportBrandsAsync(IFormFile file);
    Task<(int Imported, List<string> Errors)> ImportStoresAsync(IFormFile file);
    Task<(int Imported, List<string> Errors)> ImportCargosAsync(IFormFile file);
    Task<(int Imported, List<string> Errors)> ImportEmployeesAsync(IFormFile file);
}
