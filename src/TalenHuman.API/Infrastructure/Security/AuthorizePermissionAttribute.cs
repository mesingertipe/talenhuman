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
        
        // Support legacy name mapping for the active module check
        var targetModule = _moduleCode;
        if (targetModule == "ATTENDANCE") targetModule = "OPERATIONS";
        if (targetModule == "ADMIN") targetModule = "SYSTEM";

        if (!activeModules.Contains(targetModule) && !activeModules.Contains(_moduleCode))
        {
            context.Result = new ForbidResult();
            return Task.CompletedTask;
        }

        // 2. Check Permissions (claim 'perm')
        // Supports both formats: 
        // - "MODULE:Actions" (Legacy)
        // - "MODULE:SUBMODULE:Actions" (Granular)
        var actionShort = _action.ToString().Substring(0, 1).ToUpper();
        var permissionClaims = user.Claims
            .Where(c => c.Type == "perm")
            .Select(c => c.Value)
            .Where(v => v.StartsWith($"{targetModule}:") || v.StartsWith($"{_moduleCode}:"))
            .ToList();

        bool isAllowed = false;
        foreach (var claimValue in permissionClaims)
        {
            var parts = claimValue.Split(':');
            if (parts.Length < 2) continue;
            
            var actions = parts.Last();
            if (actions.Contains(actionShort))
            {
                isAllowed = true;
                break;
            }
        }

        if (!isAllowed)
        {
            context.Result = new ForbidResult();
            return Task.CompletedTask;
        }

        return Task.CompletedTask;
    }
}
