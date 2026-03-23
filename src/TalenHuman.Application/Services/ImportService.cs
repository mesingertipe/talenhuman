using ExcelDataReader;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Data;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;
using MediatR;
using TalenHuman.Application.Employees;

namespace TalenHuman.Application.Services;

public class ImportService : IImportService
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;
    private readonly IMediator _mediator;

    public ImportService(
        IApplicationDbContext context, 
        ITenantProvider tenantProvider,
        IMediator mediator)
    {
        _context = context;
        _tenantProvider = tenantProvider;
        _mediator = mediator;
    }

    public async Task<(int Imported, List<string> Errors)> ImportBrandsAsync(IFormFile file)
    {
        var data = ReadExcel(file);
        var errors = new List<string>();
        var count = 0;
        var companyId = _tenantProvider.GetTenantId();

        foreach (DataRow row in data.Rows)
        {
            try
            {
                var name = row[0]?.ToString()?.Trim();
                if (string.IsNullOrEmpty(name)) continue;

                if (await _context.Brands.AnyAsync(b => b.Name == name)) continue;

                _context.Brands.Add(new Brand { Name = name, CompanyId = companyId });
                count++;
            }
            catch (Exception ex)
            {
                errors.Add($"Error en fila {data.Rows.IndexOf(row) + 1}: {ex.Message}");
            }
        }

        await _context.SaveChangesAsync(CancellationToken.None);
        return (count, errors);
    }

    public async Task<(int Imported, List<string> Errors)> ImportStoresAsync(IFormFile file)
    {
        var data = ReadExcel(file);
        var errors = new List<string>();
        var count = 0;
        var companyId = _tenantProvider.GetTenantId();

        foreach (DataRow row in data.Rows)
        {
            try
            {
                var name = row[0]?.ToString()?.Trim();
                var address = row[1]?.ToString()?.Trim();
                var brandName = row[2]?.ToString()?.Trim();
                
                if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(brandName)) continue;

                var brand = await _context.Brands.FirstOrDefaultAsync(b => b.Name == brandName);
                if (brand == null)
                {
                    errors.Add($"Marca '{brandName}' no encontrada para la tienda '{name}'");
                    continue;
                }

                if (await _context.Stores.AnyAsync(s => s.Name == name)) continue;

                _context.Stores.Add(new Store 
                { 
                    Name = name, 
                    Address = address ?? "", 
                    BrandId = brand.Id,
                    CompanyId = companyId 
                });
                count++;
            }
            catch (Exception ex)
            {
                errors.Add($"Error en fila {data.Rows.IndexOf(row) + 1}: {ex.Message}");
            }
        }

        await _context.SaveChangesAsync(CancellationToken.None);
        return (count, errors);
    }

    public async Task<(int Imported, List<string> Errors)> ImportCargosAsync(IFormFile file)
    {
        var data = ReadExcel(file);
        var errors = new List<string>();
        var count = 0;
        var companyId = _tenantProvider.GetTenantId();

        foreach (DataRow row in data.Rows)
        {
            try
            {
                var name = row[0]?.ToString()?.Trim();
                var description = row[1]?.ToString()?.Trim();
                
                if (string.IsNullOrEmpty(name)) continue;

                if (await _context.Profiles.AnyAsync(p => p.Name == name)) continue;

                _context.Profiles.Add(new Profile 
                { 
                    Name = name, 
                    Description = description,
                    CompanyId = companyId 
                });
                count++;
            }
            catch (Exception ex)
            {
                errors.Add($"Error en fila {data.Rows.IndexOf(row) + 1}: {ex.Message}");
            }
        }

        await _context.SaveChangesAsync(CancellationToken.None);
        return (count, errors);
    }

    public async Task<(int Imported, List<string> Errors)> ImportEmployeesAsync(IFormFile file)
    {
        var data = ReadExcel(file);
        var errors = new List<string>();
        var count = 0;

        foreach (DataRow row in data.Rows)
        {
            try
            {
                var command = new CreateEmployeeCommand
                {
                    FirstName = row[0]?.ToString()?.Trim() ?? "",
                    LastName = row[1]?.ToString()?.Trim() ?? "",
                    Email = row[2]?.ToString()?.Trim() ?? "",
                    IdentificationNumber = row[3]?.ToString()?.Trim() ?? "",
                    Role = row[6]?.ToString()?.Trim() ?? "Empleado"
                };

                var storeName = row[4]?.ToString()?.Trim();
                var profileName = row[5]?.ToString()?.Trim();

                var store = await _context.Stores.FirstOrDefaultAsync(s => s.Name == storeName);
                var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.Name == profileName);

                if (store == null || profile == null)
                {
                    errors.Add($"Tienda '{storeName}' o Cargo '{profileName}' no encontrados para {command.FirstName}");
                    continue;
                }

                command = command with { StoreId = store.Id, ProfileId = profile.Id };

                await _mediator.Send(command);
                count++;
            }
            catch (Exception ex)
            {
                errors.Add($"Error en fila {data.Rows.IndexOf(row) + 1}: {ex.Message}");
            }
        }

        return (count, errors);
    }

    private DataTable ReadExcel(IFormFile file)
    {
        System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);
        using var stream = file.OpenReadStream();
        using var reader = ExcelReaderFactory.CreateReader(stream);
        var result = reader.AsDataSet(new ExcelDataSetConfiguration()
        {
            ConfigureDataTable = (_) => new ExcelDataTableConfiguration() { UseHeaderRow = true }
        });
        return result.Tables[0];
    }
}
