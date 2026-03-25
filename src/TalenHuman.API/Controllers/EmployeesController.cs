using MediatR;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using TalenHuman.Domain.Common;
using TalenHuman.Application.Common.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Employees;
using TalenHuman.Domain.Entities;
using TalenHuman.Infrastructure.Persistence;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ApplicationDbContext _context;
    private readonly UserManager<User> _userManager;

    public EmployeesController(IMediator mediator, ApplicationDbContext context, UserManager<User> userManager)
    {
        _mediator = mediator;
        _context = context;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetEmployees()
    {
        var userId = Guid.Parse(User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
        var userRoles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(r => r.Value).ToList();

        var query = _context.Employees
            .Include(e => e.Store)
            .Include(e => e.Profile)
            .Include(e => e.Jornada)
            .AsQueryable();

        // RBAC: Filter by Managed Stores for Managers and Supervisors
        if (!userRoles.Contains("SuperAdmin") && !userRoles.Contains("Admin") && !userRoles.Contains("RH"))
        {
            if (userRoles.Contains("Supervisor") || userRoles.Contains("Gerente"))
            {
                var managedStores = await _context.Set<SupervisorStore>()
                    .Where(ss => ss.UserId == userId)
                    .Select(ss => ss.StoreId)
                    .ToListAsync();
                
                query = query.Where(e => managedStores.Contains(e.StoreId));
            }
        }

        var employees = await query.ToListAsync();

        var result = new List<object>();
        foreach (var emp in employees)
        {
            string role = "Empleado";
            if (emp.UserId != null)
            {
                var user = await _userManager.FindByIdAsync(emp.UserId.Value.ToString());
                if (user != null)
                {
                    var roles = await _userManager.GetRolesAsync(user);
                    role = roles.FirstOrDefault() ?? "Empleado";
                }
            }

            result.Add(new
            {
                emp.Id,
                emp.FirstName,
                emp.LastName,
                emp.Email,
                emp.IdentificationNumber,
                emp.BirthDate,
                emp.StoreId,
                emp.ProfileId,
                emp.JornadaId, // Added JornadaId
                JornadaNombre = emp.Jornada != null ? emp.Jornada.Nombre : "No asignada", // Added JornadaNombre
                emp.DateOfEntry,
                emp.IsActive,
                StoreName = emp.Store?.Name,
                ProfileName = emp.Profile?.Name,
                Role = role
            });
        }
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,RH,Gerente")]
    public async Task<ActionResult<Guid>> Create([FromBody] CreateEmployeeCommand command)
    {
        return await _mediator.Send(command);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin,Admin,RH,Gerente")]
    public async Task<IActionResult> UpdateEmployee(Guid id, [FromBody] UpdateEmployeeDto dto)
    {
        var employee = await _context.Employees.FindAsync(id);
        if (employee == null) return NotFound();

        // Check for existing identification number (Cédula) - excluding current employee
        var exists = await _context.Employees
            .IgnoreQueryFilters()
            .AnyAsync(x => x.Id != id && x.IdentificationNumber == dto.IdentificationNumber);
            
        if (exists)
        {
            return BadRequest(new { message = $"El número de identificación {dto.IdentificationNumber} ya se encuentra registrado en el sistema." });
        }

        employee.FirstName = dto.FirstName;
        employee.LastName = dto.LastName;
        employee.IdentificationNumber = dto.IdentificationNumber;
        employee.BirthDate = dto.BirthDate;
        employee.StoreId = dto.StoreId;
        employee.ProfileId = dto.ProfileId;
        employee.JornadaId = dto.JornadaId;
        employee.DateOfEntry = dto.DateOfEntry;
        employee.IsActive = dto.IsActive;

        _context.Entry(employee).State = EntityState.Modified;
        
        if (employee.UserId != null)
        {
            var user = await _userManager.FindByIdAsync(employee.UserId.Value.ToString());
            if (user != null)
            {
                user.FullName = $"{dto.FirstName} {dto.LastName}";
                user.IsActive = dto.IsActive;
                await _userManager.UpdateAsync(user);

                var currentRoles = await _userManager.GetRolesAsync(user);
                await _userManager.RemoveFromRolesAsync(user, currentRoles);
                await _userManager.AddToRoleAsync(user, dto.Role);
            }
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin,Admin,RH,Gerente")]
    public async Task<IActionResult> DeleteEmployee(Guid id)
    {
        var employee = await _context.Employees.FindAsync(id);
        if (employee == null) return NotFound();

        if (employee.UserId != null)
        {
            var user = await _userManager.FindByIdAsync(employee.UserId.Value.ToString());
            if (user != null)
            {
                user.IsActive = false;
                await _userManager.UpdateAsync(user);
            }
        }

        employee.IsActive = false;
        _context.Entry(employee).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("by-cedula/{cedula}")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> GetByCedula(string cedula)
    {
        var employee = await _context.Employees
            .Include(e => e.Store)
            .Include(e => e.Profile)
            .FirstOrDefaultAsync(e => e.IdentificationNumber == cedula && e.IsActive);

        if (employee == null)
        {
            return NotFound(new { message = "Empleado no encontrado o inactivo" });
        }

        return Ok(new
        {
            employee.Id,
            employee.FirstName,
            employee.LastName,
            employee.IdentificationNumber,
            StoreName = employee.Store?.Name,
            ProfileName = employee.Profile?.Name
        });
    }
}

public class UpdateEmployeeDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string IdentificationNumber { get; set; } = string.Empty;
    public Guid StoreId { get; set; }
    public Guid ProfileId { get; set; }
    public Guid? JornadaId { get; set; } // Added JornadaId
    public DateTime? BirthDate { get; set; }
    public DateTime DateOfEntry { get; set; }
    public bool IsActive { get; set; }
    public string Role { get; set; } = "Empleado";
}
