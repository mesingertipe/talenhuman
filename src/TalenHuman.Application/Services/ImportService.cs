using ExcelDataReader;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Data;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Application.Common.Models;
using TalenHuman.Domain.Common;
using TalenHuman.Domain.Entities;
using MediatR;
using TalenHuman.Application.Employees;
using ClosedXML.Excel;

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
    public async Task<byte[]> GenerateTemplateAsync(string type)
    {
        using var workbook = new XLWorkbook();
        var companyId = _tenantProvider.GetTenantId();

        if (type.ToLower() == "brands")
        {
            var ws = workbook.Worksheets.Add("Marcas");
            ws.Cell(1, 1).Value = "Nombre de la Marca";

            var header = ws.Range("A1:A1");
            header.Style.Font.Bold = true;
            header.Style.Fill.BackgroundColor = XLColor.FromHtml("#4f46e5");
            header.Style.Font.FontColor = XLColor.White;

            // Example row
            ws.Cell(2, 1).Value = "Marca Ejemplo S.A.";

            ws.Column(1).Width = 35;

            var wsHelp = workbook.Worksheets.Add("Instrucciones");
            wsHelp.Cell(1, 1).Value = "Instrucciones";
            wsHelp.Cell(1, 1).Style.Font.Bold = true;
            wsHelp.Cell(2, 1).Value = "- Nombre de la Marca: nombre único de la marca comercial. No se permiten duplicados.";
            wsHelp.Cell(3, 1).Value = "- No modifique los encabezados de la columna.";
            wsHelp.Columns().AdjustToContents();
        }
        else if (type.ToLower() == "profiles")
        {
            var ws = workbook.Worksheets.Add("Cargos");
            ws.Cell(1, 1).Value = "Nombre del Cargo";
            ws.Cell(1, 2).Value = "Descripción";

            var header = ws.Range("A1:B1");
            header.Style.Font.Bold = true;
            header.Style.Fill.BackgroundColor = XLColor.FromHtml("#4f46e5");
            header.Style.Font.FontColor = XLColor.White;

            // Example row
            ws.Cell(2, 1).Value = "Gerente de Tienda";
            ws.Cell(2, 2).Value = "Responsable de la operación y el equipo de la tienda asignada.";

            ws.Column(1).Width = 30;
            ws.Column(2).Width = 55;

            var wsHelp = workbook.Worksheets.Add("Instrucciones");
            wsHelp.Cell(1, 1).Value = "Instrucciones";
            wsHelp.Cell(1, 1).Style.Font.Bold = true;
            wsHelp.Cell(2, 1).Value = "- Nombre del Cargo: nombre único del perfil. No se permiten duplicados.";
            wsHelp.Cell(3, 1).Value = "- Descripción: texto libre explicando las responsabilidades del cargo.";
            wsHelp.Columns().AdjustToContents();
        }
        else if (type.ToLower() == "stores")
        {
            var ws = workbook.Worksheets.Add("Tiendas");
            ws.Cell(1, 1).Value = "Nombre de la Sede";
            ws.Cell(1, 2).Value = "Dirección";
            ws.Cell(1, 3).Value = "Marca Comercial";

            var header = ws.Range("A1:C1");
            header.Style.Font.Bold = true;
            header.Style.Fill.BackgroundColor = XLColor.FromHtml("#4f46e5");
            header.Style.Font.FontColor = XLColor.White;

            // Example row
            ws.Cell(2, 1).Value = "Sede Chapinero";
            ws.Cell(2, 2).Value = "Calle 53 # 20-12, Bogotá";

            ws.Column(1).Width = 30;
            ws.Column(2).Width = 40;
            ws.Column(3).Width = 30;

            // Reference sheet (visible for cross-sheet validation compatibility)
            var wsBrands = workbook.Worksheets.Add("Marcas_Referencia");
            wsBrands.Cell(1, 1).Value = "Nombre de la Marca";
            wsBrands.Cell(1, 1).Style.Font.Bold = true;
            var brands = await _context.Brands.Where(b => b.CompanyId == companyId).ToListAsync();
            for (int i = 0; i < brands.Count; i++) wsBrands.Cell(i + 2, 1).Value = brands[i].Name;
            wsBrands.Column(1).Width = 35;

            // Dropdown for Marca Comercial (col C) using formula string
            if (brands.Count > 0)
            {
                var brandValidation = ws.Range("C2:C500").CreateDataValidation();
                brandValidation.List($"Marcas_Referencia!$A$2:$A${brands.Count + 1}", true);
            }

            var wsHelp = workbook.Worksheets.Add("Instrucciones");
            wsHelp.Cell(1, 1).Value = "Instrucciones";
            wsHelp.Cell(1, 1).Style.Font.Bold = true;
            wsHelp.Cell(2, 1).Value = "- Nombre de la Sede: nombre único del punto de venta.";
            wsHelp.Cell(3, 1).Value = "- Dirección: dirección física completa.";
            wsHelp.Cell(4, 1).Value = "- Marca Comercial: seleccione del listón desplegable (solo marcas registradas).";
            wsHelp.Columns().AdjustToContents();
        }
        else if (type.ToLower() == "employees")
        {
            var ws = workbook.Worksheets.Add("Empleados");

            // Headers
            ws.Cell(1, 1).Value = "Nombre";
            ws.Cell(1, 2).Value = "Apellidos";
            ws.Cell(1, 3).Value = "Cédula";
            ws.Cell(1, 4).Value = "Sede Asignada";
            ws.Cell(1, 5).Value = "Perfil de Cargo";
            ws.Cell(1, 6).Value = "Fecha de Nacimiento";
            ws.Cell(1, 7).Value = "Fecha de Ingreso";
            ws.Cell(1, 8).Value = "Activo (SI/NO)";

            // Style headers
            var headerRange = ws.Range("A1:H1");
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#4f46e5");
            headerRange.Style.Font.FontColor = XLColor.White;

            // Example data row
            ws.Cell(2, 1).Value = "Juan";
            ws.Cell(2, 2).Value = "Pérez Gómez";
            ws.Cell(2, 3).Value = "1016914200";
            ws.Cell(2, 6).Value = "1990-05-15";
            ws.Cell(2, 7).Value = DateTime.Today.ToString("yyyy-MM-dd");
            ws.Cell(2, 8).Value = "SI";

            // Format date columns
            ws.Column(6).Style.NumberFormat.Format = "yyyy-MM-dd";
            ws.Column(7).Style.NumberFormat.Format = "yyyy-MM-dd";

            ws.Columns().AdjustToContents();

            // --- Reference sheets (visible so Excel can resolve cross-sheet validation) ---
            var wsStores = workbook.Worksheets.Add("Tiendas_Referencia");
            wsStores.Cell(1, 1).Value = "Nombre de la Tienda";
            wsStores.Cell(1, 1).Style.Font.Bold = true;
            var stores = await _context.Stores.Where(s => s.CompanyId == companyId).ToListAsync();
            for (int i = 0; i < stores.Count; i++) wsStores.Cell(i + 2, 1).Value = stores[i].Name;
            wsStores.Column(1).Width = 35;

            var wsProfiles = workbook.Worksheets.Add("Cargos_Referencia");
            wsProfiles.Cell(1, 1).Value = "Nombre del Cargo";
            wsProfiles.Cell(1, 1).Style.Font.Bold = true;
            var profiles = await _context.Profiles.Where(p => p.CompanyId == companyId).ToListAsync();
            for (int i = 0; i < profiles.Count; i++) wsProfiles.Cell(i + 2, 1).Value = profiles[i].Name;
            wsProfiles.Column(1).Width = 35;

            // --- Excel data-validation dropdowns using formula strings (cross-sheet compatible) ---
            if (stores.Count > 0)
            {
                var storeValidation = ws.Range("D2:D500").CreateDataValidation();
                storeValidation.List($"Tiendas_Referencia!$A$2:$A${stores.Count + 1}", true);
            }

            if (profiles.Count > 0)
            {
                var profileValidation = ws.Range("E2:E500").CreateDataValidation();
                profileValidation.List($"Cargos_Referencia!$A$2:$A${profiles.Count + 1}", true);
            }

            // Active dropdown (inline list — no sheet needed)
            var activeValidation = ws.Range("H2:H500").CreateDataValidation();
            activeValidation.List($"\"SI,NO\"", true);

            var wsHelp = workbook.Worksheets.Add("Instrucciones");
            wsHelp.Cell(1, 1).Value = "Instrucciones de diligenciamiento";
            wsHelp.Cell(1, 1).Style.Font.Bold = true;
            wsHelp.Cell(2, 1).Value = "- Cédula: número único de identificación. Será el usuario y la contraseña inicial.";
            wsHelp.Cell(3, 1).Value = "- Sede Asignada: seleccione del listón desplegable (solo opciones válidas).";
            ws.Cell(4, 1).Value = "- Perfil de Cargo: seleccione del listón desplegable.";
            ws.Cell(5, 1).Value = "- Fecha de Nacimiento: formato YYYY-MM-DD (Requerido para recuperación de clave).";
            ws.Cell(6, 1).Value = "- Fecha de Ingreso: formato YYYY-MM-DD (Ej: 2026-03-23).";
            ws.Cell(7, 1).Value = "- Activo: SI o NO.";
            wsHelp.Columns().AdjustToContents();
        }

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    public async Task<ImportPreviewDto> ValidateImportAsync(string type, IFormFile file)
    {
        var data = ReadExcel(file);
        var preview = new ImportPreviewDto { Type = type };
        
        foreach (DataColumn col in data.Columns) preview.Headers.Add(col.ColumnName);

        for (int i = 0; i < data.Rows.Count; i++)
        {
            var row = data.Rows[i];
            var importRow = new ImportRowDto { RowNumber = i + 2 };
            foreach (DataColumn col in data.Columns)
            {
                importRow.Data[col.ColumnName] = row[col]?.ToString() ?? "";
            }

            // Specific Validations
            if (type.ToLower() == "brands")
            {
                var name = importRow.Data.GetValueOrDefault("Nombre de la Marca");
                if (string.IsNullOrEmpty(name))
                    importRow.Errors.Add(new ImportFieldError { Field = "Nombre de la Marca", Message = "El nombre de la marca es requerido" });
            }
            else if (type.ToLower() == "profiles")
            {
                var name = importRow.Data.GetValueOrDefault("Nombre del Cargo");
                if (string.IsNullOrEmpty(name))
                    importRow.Errors.Add(new ImportFieldError { Field = "Nombre del Cargo", Message = "El nombre del cargo es requerido" });
            }
            else if (type.ToLower() == "stores")
            {
                var name = importRow.Data.GetValueOrDefault("Nombre de la Sede");
                if (string.IsNullOrEmpty(name))
                    importRow.Errors.Add(new ImportFieldError { Field = "Nombre de la Sede", Message = "El nombre de la sede es requerido" });

                var brandName = importRow.Data.GetValueOrDefault("Marca Comercial");
                var brand = await _context.Brands.AnyAsync(b => b.Name == brandName);
                if (!brand)
                    importRow.Errors.Add(new ImportFieldError { Field = "Marca Comercial", Message = $"La marca '{brandName}' no existe" });
            }
            else if (type.ToLower() == "employees")
            {
                var cedula = importRow.Data.GetValueOrDefault("Cédula");
                if (string.IsNullOrEmpty(cedula))
                    importRow.Errors.Add(new ImportFieldError { Field = "Cédula", Message = "La cédula es requerida" });

                var nombre = importRow.Data.GetValueOrDefault("Nombre");
                if (string.IsNullOrEmpty(nombre))
                    importRow.Errors.Add(new ImportFieldError { Field = "Nombre", Message = "El nombre es requerido" });

                var apellidos = importRow.Data.GetValueOrDefault("Apellidos");
                if (string.IsNullOrEmpty(apellidos))
                    importRow.Errors.Add(new ImportFieldError { Field = "Apellidos", Message = "Los apellidos son requeridos" });

                var sedeNombre = importRow.Data.GetValueOrDefault("Sede Asignada");
                var store = await _context.Stores.AnyAsync(s => s.Name == sedeNombre);
                if (!store)
                    importRow.Errors.Add(new ImportFieldError { Field = "Sede Asignada", Message = $"La sede '{sedeNombre}' no existe" });

                var cargoNombre = importRow.Data.GetValueOrDefault("Perfil de Cargo");
                var profile = await _context.Profiles.AnyAsync(p => p.Name == cargoNombre);
                if (!profile)
                    importRow.Errors.Add(new ImportFieldError { Field = "Perfil de Cargo", Message = $"El cargo '{cargoNombre}' no existe" });
            }

            preview.Rows.Add(importRow);
        }

        return preview;
    }

    public async Task<ImportResultDto> ExecuteImportAsync(string type, List<ImportRowDto> rows)
    {
        var result = new ImportResultDto();
        var companyId = _tenantProvider.GetTenantId();
        
        if (type.ToLower() == "brands")
        {
            foreach (var row in rows)
            {
                try 
                {
                    var name = row.Data["Nombre de la Marca"];
                    if (!await _context.Brands.AnyAsync(b => b.Name == name))
                    {
                        _context.Brands.Add(new Brand { Name = name, CompanyId = companyId });
                        result.SuccessCount++;
                    }
                }
                catch (Exception ex)
                {
                    result.ErrorCount++;
                    result.Messages.Add($"Fila {row.RowNumber}: {ex.Message}");
                }
            }
            await _context.SaveChangesAsync(CancellationToken.None);
        }
        else if (type.ToLower() == "profiles")
        {
            foreach (var row in rows)
            {
                try 
                {
                    var name = row.Data["Nombre del Cargo"];
                    var description = row.Data.GetValueOrDefault("Descripción");
                    if (!await _context.Profiles.AnyAsync(p => p.Name == name))
                    {
                        _context.Profiles.Add(new Profile { Name = name, Description = description, CompanyId = companyId });
                        result.SuccessCount++;
                    }
                }
                catch (Exception ex)
                {
                    result.ErrorCount++;
                    result.Messages.Add($"Fila {row.RowNumber}: {ex.Message}");
                }
            }
            await _context.SaveChangesAsync(CancellationToken.None);
        }
        else if (type.ToLower() == "stores")
        {
            foreach (var row in rows)
            {
                try 
                {
                    var name = row.Data["Nombre de la Sede"];
                    var address = row.Data.GetValueOrDefault("Dirección");
                    var brandName = row.Data["Marca Comercial"];
                    
                    var brand = await _context.Brands.FirstOrDefaultAsync(b => b.Name == brandName);
                    if (brand != null && !await _context.Stores.AnyAsync(s => s.Name == name))
                    {
                        _context.Stores.Add(new Store { Name = name, Address = address ?? string.Empty, BrandId = brand.Id, CompanyId = companyId });
                        result.SuccessCount++;
                    }
                }
                catch (Exception ex)
                {
                    result.ErrorCount++;
                    result.Messages.Add($"Fila {row.RowNumber}: {ex.Message}");
                }
            }
            await _context.SaveChangesAsync(CancellationToken.None);
        }
        else if (type.ToLower() == "employees")
        {
            foreach (var row in rows)
            {
                try 
                {
                    var sedeNombre = row.Data["Sede Asignada"];
                    var cargoNombre = row.Data["Perfil de Cargo"];
                    var jornadaNombre = row.Data.GetValueOrDefault("Jornada");
                    var birthDateStr = row.Data.GetValueOrDefault("Fecha de Nacimiento");
                    var activeStr = row.Data.GetValueOrDefault("Activo (SI/NO)", "SI");
                    var dateStr = row.Data.GetValueOrDefault("Fecha de Ingreso");

                    var store = await _context.Stores.FirstAsync(s => s.Name == sedeNombre);
                    var profile = await _context.Profiles.FirstAsync(p => p.Name == cargoNombre);
                    var jornada = !string.IsNullOrEmpty(jornadaNombre) 
                        ? await _context.Jornadas.FirstOrDefaultAsync(j => j.Nombre == jornadaNombre)
                        : null;

                    DateTime? birthDate = DateTime.TryParse(birthDateStr, out var parsedBirth) ? parsedBirth : null;
                    DateTime dateOfEntry = DateTime.TryParse(dateStr, out var parsedDate) ? parsedDate : ColombiaTime.Now;

                    var command = new CreateEmployeeCommand
                    {
                        FirstName = row.Data["Nombre"],
                        LastName = row.Data["Apellidos"],
                        IdentificationNumber = row.Data["Cédula"],
                        BirthDate = birthDate,
                        Role = "Empleado",
                        StoreId = store.Id,
                        ProfileId = profile.Id,
                        JornadaId = jornada?.Id,
                        DateOfEntry = dateOfEntry,
                        IsActive = !activeStr.Equals("NO", StringComparison.OrdinalIgnoreCase)
                    };

                    await _mediator.Send(command);
                    result.SuccessCount++;
                }
                catch (Exception ex)
                {
                    result.ErrorCount++;
                    result.Messages.Add($"Fila {row.RowNumber}: {ex.Message}");
                }
            }
        }
        
        return result;
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
                var name = row["Nombre de la Marca"]?.ToString()?.Trim();
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
                var name = row["Nombre de la Sede"]?.ToString()?.Trim();
                var address = row["Dirección"]?.ToString()?.Trim();
                var brandName = row["Marca Comercial"]?.ToString()?.Trim();
                
                if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(brandName)) continue;

                var brand = await _context.Brands.FirstOrDefaultAsync(b => b.Name == brandName);
                if (brand == null)
                {
                    errors.Add($"Marca '{brandName}' no encontrada para la sede '{name}'");
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
                var name = row["Nombre del Cargo"]?.ToString()?.Trim();
                var description = row["Descripción"]?.ToString()?.Trim();
                
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
                var cedula = row["Cédula"]?.ToString()?.Trim() ?? "";
                var sedeNombre = row["Sede Asignada"]?.ToString()?.Trim();
                var cargoNombre = row["Perfil de Cargo"]?.ToString()?.Trim();
                var jornadaNombre = row["Jornada"]?.ToString()?.Trim(); // Added this line
                var birthDateStr = row["Fecha de Nacimiento"]?.ToString()?.Trim();
                var activeStr = row["Activo (SI/NO)"]?.ToString()?.Trim() ?? "SI";
                var dateStr = row["Fecha de Ingreso"]?.ToString()?.Trim();

                if (string.IsNullOrEmpty(cedula)) continue;

                var store = await _context.Stores.FirstOrDefaultAsync(s => s.Name == sedeNombre);
                var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.Name == cargoNombre);
                var jornada = !string.IsNullOrEmpty(jornadaNombre) 
                    ? await _context.Jornadas.FirstOrDefaultAsync(j => j.Nombre == jornadaNombre)
                    : null;

                if (store == null || profile == null)
                {
                    errors.Add($"Sede '{sedeNombre}' o Cargo '{cargoNombre}' no encontrados para cédula {cedula}");
                    continue;
                }

                DateTime? birthDate = DateTime.TryParse(birthDateStr, out var parsedBirth) ? parsedBirth : null;
                DateTime dateOfEntry = DateTime.TryParse(dateStr, out var parsedDate) ? parsedDate : DateTime.UtcNow;

                var command = new CreateEmployeeCommand
                {
                    FirstName = row["Nombre"]?.ToString()?.Trim() ?? "",
                    LastName = row["Apellidos"]?.ToString()?.Trim() ?? "",
                    IdentificationNumber = cedula,
                    BirthDate = birthDate,
                    Role = "Empleado",
                    StoreId = store.Id,
                    ProfileId = profile.Id,
                    JornadaId = jornada?.Id, // Added this line
                    DateOfEntry = dateOfEntry,
                    IsActive = !activeStr.Equals("NO", StringComparison.OrdinalIgnoreCase)
                };

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
