using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Domain.Entities;
using TalenHuman.Infrastructure.Persistence;

namespace TalenHuman.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class FaqsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public FaqsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<FaqArticle>>> GetFaqs()
    {
        var role = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
        
        var query = _context.FaqArticles.AsQueryable();
        if (role == "SuperAdmin" || role == "Soporte")
        {
            query = query.IgnoreQueryFilters();
        }

        var faqs = await query.ToListAsync();
        
        // AUTO-SEED: If this company has no FAQs, clone the system ones
        if (faqs.Count == 0 && role != "SuperAdmin" && role != "Soporte")
        {
            var systemFaqs = await _context.FaqArticles
                .IgnoreQueryFilters()
                .Where(f => f.IsSystem)
                .GroupBy(f => f.Question)
                .Select(g => g.First())
                .ToListAsync();

            if (systemFaqs.Count > 0)
            {
                var newFaqs = systemFaqs.Select(sf => new FaqArticle
                {
                    Question = sf.Question,
                    Answer = sf.Answer,
                    TargetRoles = sf.TargetRoles,
                    Category = sf.Category,
                    IsSystem = true,
                    IsActive = true
                }).ToList();

                _context.FaqArticles.AddRange(newFaqs);
                await _context.SaveChangesAsync();
                
                faqs = newFaqs;
            }
        }

        if (role == "SuperAdmin" || role == "Admin" || role == "Soporte")
            return faqs;

        return faqs.Where(f => f.TargetRoles.Contains(role ?? "")).ToList();
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,Soporte")]
    public async Task<ActionResult<FaqArticle>> CreateFaq(FaqArticle faq)
    {
        _context.FaqArticles.Add(faq);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetFaqs), new { id = faq.Id }, faq);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin,Admin,Soporte")]
    public async Task<IActionResult> UpdateFaq(Guid id, FaqArticle faq)
    {
        if (id != faq.Id) return BadRequest();

        var existing = await _context.FaqArticles.IgnoreQueryFilters().FirstOrDefaultAsync(f => f.Id == id);
        if (existing == null) return NotFound();

        existing.Question = faq.Question;
        existing.Answer = faq.Answer;
        existing.TargetRoles = faq.TargetRoles;
        existing.Category = faq.Category;
        existing.IsActive = faq.IsActive;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin,Admin,Soporte")]
    public async Task<IActionResult> DeleteFaq(Guid id)
    {
        var faq = await _context.FaqArticles.IgnoreQueryFilters().FirstOrDefaultAsync(f => f.Id == id);
        if (faq == null) return NotFound();
        if (faq.IsSystem) return BadRequest(new { message = "Cannot delete system FAQs" });

        _context.FaqArticles.Remove(faq);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
