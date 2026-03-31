using TalenHuman.Domain.Entities;

namespace TalenHuman.Application.Common.Interfaces;

public interface IIdentityService
{
    Task<(bool Succeeded, Guid UserId)> CreateUserAsync(string userName, string email, string password, string fullName, Guid companyId, string role, Guid? employeeId = null);
    Task<bool> IsInRoleAsync(Guid userId, string role);
    Task<bool> AuthorizeAsync(Guid userId, string policyName);
    Task<bool> DeleteUserAsync(Guid userId);
    Task<List<string>> GetUserPermissionsAsync(Guid userId);
}
