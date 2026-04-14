using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PredictiveRulesController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public PredictiveRulesController(IApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetRules()
    {
        return await _context.PredictiveShiftRules
            .Include(r => r.StoreType)
            .Include(r => r.RuleProfiles)
                .ThenInclude(rp => rp.Profile)
            .OrderBy(r => r.Name)
            .Select(r => new {
                r.Id,
                r.Name,
                r.Description,
                r.StoreTypeId,
                StoreTypeName = r.StoreType.Name,
                r.MetricType,
                r.Ratio,
                r.MinStaffOpening,
                r.MinStaffClosing,
                r.IsActive,
                Profiles = r.RuleProfiles.Select(rp => new { rp.ProfileId, rp.Profile.Name })
            })
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<object>> GetRule(Guid id)
    {
        var r = await _context.PredictiveShiftRules
            .Include(rule => rule.RuleProfiles)
            .FirstOrDefaultAsync(rule => rule.Id == id);

        if (r == null) return NotFound();

        return new {
            r.Id,
            r.Name,
            r.Description,
            r.StoreTypeId,
            r.MetricType,
            r.Ratio,
            r.MinStaffOpening,
            r.MinStaffClosing,
            r.IsActive,
            ProfileIds = r.RuleProfiles.Select(rp => rp.ProfileId).ToList()
        };
    }

    [HttpPost]
    public async Task<ActionResult> PostRule([FromBody] PredictiveRuleDto dto)
    {
        var companyId = _tenantProvider.GetTenantId();
        
        var rule = new PredictiveShiftRule
        {
            Name = dto.Name,
            Description = dto.Description,
            StoreTypeId = dto.StoreTypeId,
            MetricType = dto.MetricType,
            Ratio = dto.Ratio,
            MinStaffOpening = dto.MinStaffOpening,
            MinStaffClosing = dto.MinStaffClosing,
            IsActive = dto.IsActive,
            CompanyId = companyId
        };

        foreach (var profileId in dto.ProfileIds)
        {
            rule.RuleProfiles.Add(new PredictiveShiftRuleProfile 
            { 
                ProfileId = profileId, 
                CompanyId = companyId 
            });
        }

        _context.PredictiveShiftRules.Add(rule);
        await _context.SaveChangesAsync(CancellationToken.None);

        return Ok(rule);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutRule(Guid id, [FromBody] PredictiveRuleDto dto)
    {
        var rule = await _context.PredictiveShiftRules
            .Include(r => r.RuleProfiles)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (rule == null) return NotFound();

        rule.Name = dto.Name;
        rule.Description = dto.Description;
        rule.StoreTypeId = dto.StoreTypeId;
        rule.MetricType = dto.MetricType;
        rule.Ratio = dto.Ratio;
        rule.MinStaffOpening = dto.MinStaffOpening;
        rule.MinStaffClosing = dto.MinStaffClosing;
        rule.IsActive = dto.IsActive;

        // Sync Profiles
        _context.PredictiveShiftRuleProfiles.RemoveRange(rule.RuleProfiles);
        
        foreach (var profileId in dto.ProfileIds)
        {
            rule.RuleProfiles.Add(new PredictiveShiftRuleProfile 
            { 
                ProfileId = profileId, 
                CompanyId = rule.CompanyId 
            });
        }

        await _context.SaveChangesAsync(CancellationToken.None);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRule(Guid id)
    {
        var rule = await _context.PredictiveShiftRules.FindAsync(id);
        if (rule == null) return NotFound();

        _context.PredictiveShiftRules.Remove(rule);
        await _context.SaveChangesAsync(CancellationToken.None);

        return NoContent();
    }
}

public class PredictiveRuleDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid StoreTypeId { get; set; }
    public PredictiveMetricType MetricType { get; set; }
    public decimal Ratio { get; set; }
    public int MinStaffOpening { get; set; }
    public int MinStaffClosing { get; set; }
    public bool IsActive { get; set; }
    public List<Guid> ProfileIds { get; set; } = new List<Guid>();
}
