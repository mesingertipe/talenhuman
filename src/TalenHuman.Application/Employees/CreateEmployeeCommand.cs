using MediatR;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;

namespace TalenHuman.Application.Employees;

public record CreateEmployeeCommand : IRequest<Guid>
{
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string IdentificationNumber { get; init; } = string.Empty;
    public Guid StoreId { get; init; }
    public Guid ProfileId { get; init; }
    public string Role { get; init; } = "Empleado"; // Empleado, Gerente, Supervisor, RH, Admin
}

public class CreateEmployeeCommandHandler : IRequestHandler<CreateEmployeeCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly IIdentityService _identityService;
    private readonly ITenantProvider _tenantProvider;

    public CreateEmployeeCommandHandler(
        IApplicationDbContext context,
        IIdentityService identityService,
        ITenantProvider tenantProvider)
    {
        _context = context;
        _identityService = identityService;
        _tenantProvider = tenantProvider;
    }

    public async Task<Guid> Handle(CreateEmployeeCommand request, CancellationToken cancellationToken)
    {
        var companyId = _tenantProvider.GetTenantId();

        var employee = new Employee
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            IdentificationNumber = request.IdentificationNumber,
            StoreId = request.StoreId,
            ProfileId = request.ProfileId,
            CompanyId = companyId,
            DateOfEntry = DateTime.UtcNow,
            IsActive = true
        };

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync(cancellationToken);

        // Identity Automation
        string userName;
        string password;

        if (request.Role == "Empleado")
        {
            userName = request.IdentificationNumber;
            password = request.IdentificationNumber; // Initial password is IdentificationNumber
        }
        else
        {
            userName = request.Email;
            password = "TemporaryPassword123!"; // Generic initial password for managers
        }

        var (succeeded, userId) = await _identityService.CreateUserAsync(
            userName,
            request.Email,
            password,
            $"{request.FirstName} {request.LastName}",
            companyId,
            request.Role,
            employee.Id);

        if (succeeded)
        {
            employee.UserId = userId;
            await _context.SaveChangesAsync(cancellationToken);
        }

        return employee.Id;
    }
}
