using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using TalenHuman.Domain.Entities;

namespace TalenHuman.API.Infrastructure.Security;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class AuthorizePermissionAttribute : Attribute, IAsyncAuthorizationFilter
{
    private readonly string _moduleCode;
    private readonly PermissionAction _action;

    public AuthorizePermissionAttribute(string moduleCode, PermissionAction action)
    {
        _moduleCode = moduleCode;
        _action = action;
    }

    public Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;

        if (user == null || !user.Identity!.IsAuthenticated)
        {
            context.Result = new UnauthorizedResult();
            return Task.CompletedTask;
        }

        // SuperAdmin bypass
        if (user.IsInRole("SuperAdmin"))
        {
            return Task.CompletedTask;
        }

        // 1. Check if Module is active (claim 'mod')
        var activeModules = user.Claims.Where(c => c.Type == "mod").Select(c => c.Value).ToList();
        if (!activeModules.Contains(_moduleCode))
        {
            context.Result = new ForbidResult();
            return Task.CompletedTask;
        }

        // 2. Check Permissions (claim 'perm')
        // Format: "MODULE:ActionShortCodes" (e.g. "CORE:R,C,U,D")
        var permissionClaims = user.Claims.Where(c => c.Type == "perm").Select(c => c.Value).ToList();
        var modulePerm = permissionClaims.FirstOrDefault(p => p.StartsWith($"{_moduleCode}:"));

        if (modulePerm == null)
        {
            context.Result = new ForbidResult();
            return Task.CompletedTask;
        }

        var actionShortCode = _action.ToString().Substring(0, 1).ToUpper();
        var allowedActions = modulePerm.Split(':')[1];

        if (!allowedActions.Contains(actionShortCode))
        {
            context.Result = new ForbidResult();
            return Task.CompletedTask;
        }

        return Task.CompletedTask;
    }
}
