using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TalenHuman.Domain.Entities;
using TalenHuman.Infrastructure.Persistence;
using TalenHuman.Application.Common.Interfaces;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public UsersController(UserManager<User> userManager, ApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _userManager = userManager;
        _context = context;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<IEnumerable<object>>> GetUsers()
    {
        try 
        {
            var isSuperAdmin = User.IsInRole("SuperAdmin");
            var userCompanyId = Guid.Parse(User.FindFirst("CompanyId")?.Value ?? Guid.Empty.ToString());
            var selectedTenantId = _tenantProvider.GetTenantId();

            var query = _context.Users
                .Include(u => u.Company)
                .Include(u => u.District)
                .IgnoreQueryFilters();

            // Filter logic:
            // 1. If SuperAdmin, filter by selected tenant. 
            //    We always show users of the selected tenant.
            //    If the selected tenant is NOT the system tenant, we also show system users (SuperAdmins) but filter others.
            // 2. If regular Admin, ALWAYS filter by their own company (security boundary).
            var systemTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

            if (isSuperAdmin)
            {
                // If they are in the System/Master view, show everyone? 
                // The user says "solo los del seleccionado".
                // If they select a specific company, show only that company's users + SuperAdmins of the system.
                // If they are in the System/Master view, show only master-tenant users.
                // If they select a specific company, show only that company's users + the master administrator.
                if (selectedTenantId != systemTenantId)
                {
                    query = query.Where(u => u.CompanyId == selectedTenantId || (u.CompanyId == systemTenantId && u.Email == "admin@talenhuman.com"));
                }
                else
                {
                    query = query.Where(u => u.CompanyId == systemTenantId);
                }
            }
            else
            {
                query = query.Where(u => u.CompanyId == userCompanyId);
            }

            var users = await query.ToListAsync();

            var result = new List<object>();
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                
                // If not SuperAdmin, don't show SuperAdmin users in the list to regular Admins
                if (!isSuperAdmin && roles.Contains("SuperAdmin")) continue;

                // Load assigned stores
                var storeIds = await _context.Set<SupervisorStore>()
                    .IgnoreQueryFilters()
                    .Where(ss => ss.UserId == user.Id)
                    .Select(ss => ss.StoreId)
                    .ToListAsync();

                var storeNames = await _context.Stores
                    .IgnoreQueryFilters()
                    .Where(s => storeIds.Contains(s.Id))
                    .Select(s => s.Name)
                    .ToListAsync();

                result.Add(new
                {
                    user.Id,
                    user.Email,
                    user.FullName,
                    user.CompanyId,
                    CompanyName = user.Company?.Name ?? "N/A",
                    user.IsActive,
                    user.MustChangePassword,
                    user.EmployeeId,
                    user.DistrictId,
                    DistrictName = user.District != null ? user.District.Name : null,
                    Roles = roles,
                    StoreIds = storeIds,
                    StoreNames = storeNames
                });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error al obtener usuarios: {ex.Message}" });
        }
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> CreateUser([FromBody] UserCreateDto dto)
    {
        try 
        {
            var isSuperAdmin = User.IsInRole("SuperAdmin");
            var userCompanyId = Guid.Parse(User.FindFirst("CompanyId")?.Value ?? Guid.Empty.ToString());

            // Security checks for non-SuperAdmins
            if (!isSuperAdmin)
            {
                dto.CompanyId = userCompanyId; // Ensure they can only create for their own company
                
                if (dto.Roles.Contains("SuperAdmin"))
                    return Forbid("No tiene permisos para asignar el rol SuperAdmin.");
            }

            if (string.IsNullOrWhiteSpace(dto.Email)) return BadRequest(new { message = "El correo es obligatorio." });
            
            var existingUser = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (existingUser != null)
                return BadRequest(new { message = "El correo ya está registrado en el sistema." });

            var user = new User
            {
                UserName = dto.Email,
                Email = dto.Email,
                FullName = dto.FullName,
                CompanyId = dto.CompanyId,
                DistrictId = dto.DistrictId,
                IsActive = true,
                MustChangePassword = dto.MustChangePassword,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                var firstError = result.Errors.FirstOrDefault()?.Description ?? "Error al crear el usuario";
                return BadRequest(new { message = firstError, errors = result.Errors });
            }

            if (dto.Roles != null && dto.Roles.Any())
            {
                await _userManager.AddToRolesAsync(user, dto.Roles);
            }

            // Sync Stores (District stores take precedence for Supervisors)
            await SyncSupervisorStores(user.Id, dto.CompanyId, dto.StoreIds, dto.DistrictId);

            return Ok(new { user.Id, user.Email, user.FullName });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error interno: {ex.Message}" });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UserUpdateDto dto)
    {
        try 
        {
            if (id == Guid.Empty) return BadRequest(new { message = "ID de usuario inválido." });

            var isSuperAdmin = User.IsInRole("SuperAdmin");
            var userCompanyId = Guid.Parse(User.FindFirst("CompanyId")?.Value ?? Guid.Empty.ToString());

            var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return NotFound(new { message = $"Usuario no encontrado." });

            // Security checks
            if (!isSuperAdmin)
            {
                dto.CompanyId = userCompanyId; // Prevent company change for non-SuperAdmins
                
                // Cannot edit someone from another company
                if (user.CompanyId != userCompanyId)
                    return Forbid("No puede editar usuarios de otras empresas.");

                // Cannot grant SuperAdmin role
                if (dto.Roles.Contains("SuperAdmin"))
                    return Forbid("No puede asignar el rol SuperAdmin.");
                
                // Cannot edit a SuperAdmin user
                var currentRoles = await _userManager.GetRolesAsync(user);
                if (currentRoles.Contains("SuperAdmin"))
                    return Forbid("No tiene permisos para editar un Super Administrador.");
            }

            user.FullName = dto.FullName;
            user.IsActive = dto.IsActive;
            user.MustChangePassword = dto.MustChangePassword;
            user.CompanyId = dto.CompanyId;
            user.DistrictId = dto.DistrictId;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                 var firstError = result.Errors.FirstOrDefault()?.Description ?? "Error al actualizar el usuario";
                 return BadRequest(new { message = firstError, errors = result.Errors });
            }

            // Update Roles
            var rolesToUpdate = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, rolesToUpdate);
            if (dto.Roles != null && dto.Roles.Any())
            {
                await _userManager.AddToRolesAsync(user, dto.Roles);
            }

            // Sync Stores (District stores take precedence for Supervisors)
            await SyncSupervisorStores(user.Id, dto.CompanyId, dto.StoreIds, dto.DistrictId);

            // Optional: Password reset
            if (!string.IsNullOrEmpty(dto.NewPassword))
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var passResult = await _userManager.ResetPasswordAsync(user, token, dto.NewPassword);
                if (!passResult.Succeeded)
                {
                     return BadRequest(new { message = passResult.Errors.FirstOrDefault()?.Description ?? "Error al actualizar la contraseña" });
                }
                user.MustChangePassword = dto.MustChangePassword;
                await _userManager.UpdateAsync(user);
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error interno al actualizar: {ex.Message}" });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        try 
        {
            if (id == Guid.Empty) return BadRequest(new { message = "ID inválido." });
            
            var isSuperAdmin = User.IsInRole("SuperAdmin");
            var userCompanyId = Guid.Parse(User.FindFirst("CompanyId")?.Value ?? Guid.Empty.ToString());

            var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return NotFound(new { message = "Usuario no encontrado." });

            if (!isSuperAdmin)
            {
                if (user.CompanyId != userCompanyId)
                    return Forbid("No puede eliminar usuarios de otras empresas.");

                var roles = await _userManager.GetRolesAsync(user);
                if (roles.Contains("SuperAdmin"))
                    return Forbid("No puede eliminar un Super Administrador.");
            }

            // Clean up store assignments first
            var assignments = await _context.Set<SupervisorStore>()
                .IgnoreQueryFilters()
                .Where(ss => ss.UserId == user.Id)
                .ToListAsync();
            _context.Set<SupervisorStore>().RemoveRange(assignments);

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded) return BadRequest(new { message = "No se pudo eliminar el usuario", errors = result.Errors });

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error al eliminar: {ex.Message}" });
        }
    }

    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] PasswordChangeDto dto)
    {
        try 
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(userIdStr);
            if (user == null) return NotFound();

            var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = result.Errors.FirstOrDefault()?.Description ?? "Error al cambiar la contraseña" });
            }

            user.MustChangePassword = false;
            await _userManager.UpdateAsync(user);

            return Ok(new { message = "Contraseña actualizada con éxito" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error al cambiar contraseña: {ex.Message}" });
        }
    }

    private async Task SyncSupervisorStores(Guid userId, Guid companyId, List<Guid> storeIds, Guid? districtId = null)
    {
        // 1. Remove existing assignments
        var current = await _context.Set<SupervisorStore>()
            .IgnoreQueryFilters()
            .Where(ss => ss.UserId == userId)
            .ToListAsync();
        
        _context.Set<SupervisorStore>().RemoveRange(current);

        // 2. Determine final list of stores
        HashSet<Guid> finalStoreIds = new HashSet<Guid>(storeIds ?? new List<Guid>());

        // If district is assigned, include all stores from that district
        if (districtId.HasValue)
        {
            var districtStores = await _context.Stores
                .IgnoreQueryFilters()
                .Where(s => s.DistrictId == districtId.Value)
                .Select(s => s.Id)
                .ToListAsync();
            
            foreach (var id in districtStores)
            {
                finalStoreIds.Add(id);
            }

            // Sync the District's SupervisorId as well
            var district = await _context.Set<District>().IgnoreQueryFilters()
                .FirstOrDefaultAsync(d => d.Id == districtId.Value);
            
            if (district != null)
            {
                district.SupervisorId = userId;
                _context.Update(district);
            }
        }

        // 3. Add new ones
        if (finalStoreIds.Any())
        {
            foreach (var storeId in finalStoreIds)
            {
                _context.Set<SupervisorStore>().Add(new SupervisorStore
                {
                    UserId = userId,
                    StoreId = storeId,
                    CompanyId = companyId
                });
            }
        }

        await _context.SaveChangesAsync();
    }
}

public class UserCreateDto
{
    public string Email { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Password { get; set; } = null!;
    public Guid CompanyId { get; set; }
    public bool MustChangePassword { get; set; } = true;
    public List<string> Roles { get; set; } = new();
    public List<Guid> StoreIds { get; set; } = new();
    public Guid? DistrictId { get; set; }
}

public class UserUpdateDto
{
    public string FullName { get; set; } = null!;
    public Guid CompanyId { get; set; }
    public bool IsActive { get; set; }
    public bool MustChangePassword { get; set; }
    public List<string> Roles { get; set; } = new();
    public string? NewPassword { get; set; }
    public List<Guid> StoreIds { get; set; } = new();
    public Guid? DistrictId { get; set; }
}

public class PasswordChangeDto
{
    public string CurrentPassword { get; set; } = null!;
    public string NewPassword { get; set; } = null!;
}
