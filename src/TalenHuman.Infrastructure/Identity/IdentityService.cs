using Microsoft.AspNetCore.Identity;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;

namespace TalenHuman.Infrastructure.Identity;

public class IdentityService : IIdentityService
{
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<Role> _roleManager;

    public IdentityService(
        UserManager<User> userManager,
        RoleManager<Role> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
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
}
