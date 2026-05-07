using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;

namespace TalenHuman.Infrastructure.Identity;

public class IdentityService : IIdentityService
{
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<Role> _roleManager;
    private readonly IApplicationDbContext _context;

    public IdentityService(
        UserManager<User> userManager,
        RoleManager<Role> roleManager,
        IApplicationDbContext context)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
    }

    public async Task<(bool Succeeded, Guid UserId)> CreateUserAsync(
        string userName, 
        string email, 
        string password, 
        string fullName, 
        Guid companyId, 
        string role, 
        Guid? employeeId = null)
    {
        var user = new User
        {
            UserName = userName,
            Email = email,
            FullName = fullName,
            CompanyId = companyId,
            EmployeeId = employeeId,
            MustChangePassword = true
        };

        var result = await _userManager.CreateAsync(user, password);

        if (!result.Succeeded)
            return (false, Guid.Empty);

        // Ensure role exists
        if (!await _roleManager.RoleExistsAsync(role))
        {
            await _roleManager.CreateAsync(new Role { Name = role });
        }

        await _userManager.AddToRoleAsync(user, role);

        return (true, user.Id);
    }

    public async Task<bool> IsInRoleAsync(Guid userId, string role)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        return user != null && await _userManager.IsInRoleAsync(user, role);
    }

    public Task<bool> AuthorizeAsync(Guid userId, string policyName)
    {
        // Simple placeholder for policy-based auth
        return Task.FromResult(true);
    }

    public async Task<bool> DeleteUserAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user != null)
        {
            var result = await _userManager.DeleteAsync(user);
            return result.Succeeded;
        }
        return false;
    }

    public async Task<List<string>> GetUserPermissionsAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return new List<string>();

        var userRoles = await _userManager.GetRolesAsync(user);

        var roleIds = await _context.Roles
            .IgnoreQueryFilters()
            .Where(r => userRoles.Contains(r.Name!))
            .Select(r => r.Id)
            .ToListAsync();

        // 4. Get granular permissions from matrix
        // V13.9.65: FINAL ROBUST QUERY - Direct Join to ensure Module Codes are never null and relations are solid
        var permissions = await (from p in _context.ModulePermissions.IgnoreQueryFilters()
                               join m in _context.Modules.IgnoreQueryFilters() on p.ModuleId equals m.Id
                               where p.CompanyId == user.CompanyId && 
                                     roleIds.Contains(p.RoleId) && 
                                     p.IsAllowed
                               select new {
                                   ModuleCode = m.Code,
                                   SubModuleCode = p.SubModuleCode,
                                   Action = p.Action
                               }).ToListAsync();

        // Group by Module and format actions
        // Logic: 
        // 1. If SubModuleCode is present, use "Module:SubModule:Actions"
        // 2. If SubModuleCode is null, use "Module:Actions" (legacy/global)
        // V13.9.52: Normalizing with Trim() and ToUpper() to prevent data inconsistencies
        var grouped = permissions
            .GroupBy(p => string.IsNullOrEmpty(p.SubModuleCode) ? p.ModuleCode?.Trim().ToUpper() : $"{p.ModuleCode?.Trim().ToUpper()}:{p.SubModuleCode?.Trim().ToUpper()}")
            .Select(g => 
            {
                var actions = string.Join("", g.Select(p => p.Action.ToString().Substring(0, 1).ToUpper()).Distinct().OrderBy(a => a));
                return $"{g.Key}:{actions}";
            })
            .ToList();

        return grouped;
    }
}
