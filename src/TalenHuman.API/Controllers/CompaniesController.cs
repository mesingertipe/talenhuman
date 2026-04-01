using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Domain.Entities;
using TalenHuman.Infrastructure.Persistence;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CompaniesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CompaniesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("current")]
    public async Task<ActionResult<Company>> GetCurrentCompany()
    {
        // Tenant Provider returns the current context ID
        var tenantId = Guid.Empty;
        var claim = User.FindFirst("CompanyId")?.Value;
        if (string.IsNullOrEmpty(claim)) return BadRequest("Token missing CompanyId claim.");
        
        tenantId = Guid.Parse(claim);
        var company = await _context.Companies.FindAsync(tenantId);
        if (company == null) return NotFound();
        
        return Ok(company);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Company>>> GetCompanies()
    {
        // Ignore Global Filter for SuperAdmin to see all companies
        // Note: Global filters are only applied to entities that have IMultitenant.
        // Company does NOT have IMultitenant, so it's always global.
        return await _context.Companies.ToListAsync();
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<Company>> PostCompany(Company company)
    {
        _context.Companies.Add(company);
        await _context.SaveChangesAsync();
        return Ok(company);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> PutCompany(Guid id, Company company)
    {
        if (id != company.Id) return BadRequest();

        var existing = await _context.Companies.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Name = company.Name;
        existing.TaxId = company.TaxId;
        existing.IsActive = company.IsActive;
        existing.CountryCode = company.CountryCode;
        existing.TimeZoneId = company.TimeZoneId;
        existing.PrivacyPolicyText = company.PrivacyPolicyText;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> DeleteCompany(Guid id)
    {
        // 1. Load Company and check if it exists
        var company = await _context.Companies.FindAsync(id);
        if (company == null) return NotFound();

        // 2. Security: Don't allow deleting the master tenant
        if (id == Guid.Parse("11111111-1111-1111-1111-111111111111"))
            return BadRequest("No se puede eliminar el tenant principal.");

        // 3. Manual Cleanup (Bottom-Up to satisfy constraints)
        // We use ExecuteDeleteAsync for performance if available, or just remove ranges.
        // Note: We ignore global filters here to ensure we find ALL data for this company.
        
        // Operations
        _context.Absences.RemoveRange(_context.Absences.IgnoreQueryFilters().Where(x => x.CompanyId == id));
        _context.Attendances.RemoveRange(_context.Attendances.IgnoreQueryFilters().Where(x => x.CompanyId == id));
        _context.Shifts.RemoveRange(_context.Shifts.IgnoreQueryFilters().Where(x => x.CompanyId == id));
        
        // Relationships
        _context.Set<SupervisorStore>().RemoveRange(_context.Set<SupervisorStore>().IgnoreQueryFilters().Where(x => x.CompanyId == id));
        
        // Core Entities
        _context.Employees.RemoveRange(_context.Employees.IgnoreQueryFilters().Where(x => x.CompanyId == id));
        _context.Stores.RemoveRange(_context.Stores.IgnoreQueryFilters().Where(x => x.CompanyId == id));
        _context.Brands.RemoveRange(_context.Brands.IgnoreQueryFilters().Where(x => x.CompanyId == id));
        _context.Profiles.RemoveRange(_context.Profiles.IgnoreQueryFilters().Where(x => x.CompanyId == id));
        
        // Users (Identity)
        var users = await _context.Users.IgnoreQueryFilters().Where(u => u.CompanyId == id).ToListAsync();
        _context.Users.RemoveRange(users);

        // Finally, the company
        _context.Companies.Remove(company);

        try 
        {
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest($"No se pudo eliminar la empresa debido a dependencias activas: {ex.Message}");
        }
    }
}
