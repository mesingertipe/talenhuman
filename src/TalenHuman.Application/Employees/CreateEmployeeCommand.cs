using MediatR;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;

namespace TalenHuman.Application.Employees;

public record CreateEmployeeCommand : IRequest<Guid>
{
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string IdentificationNumber { get; init; } = string.Empty;
    public Guid StoreId { get; init; }
    public Guid ProfileId { get; init; }
    public DateTime DateOfEntry { get; init; }
    public bool IsActive { get; init; } = true;
    public string Role { get; init; } = "Empleado";
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

        var generatedEmail = $"{request.IdentificationNumber}@talenhuman.local";

        var employee = new Employee
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = generatedEmail,
            IdentificationNumber = request.IdentificationNumber,
            StoreId = request.StoreId,
            ProfileId = request.ProfileId,
            CompanyId = companyId,
            DateOfEntry = request.DateOfEntry.ToUniversalTime(),
            IsActive = request.IsActive
        };

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync(cancellationToken);

        // Identity Automation
        string userName;
        string password;

        userName = request.IdentificationNumber;
        password = request.IdentificationNumber; // Initial password is IdentificationNumber

        var (succeeded, userId) = await _identityService.CreateUserAsync(
            userName,
            generatedEmail,
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
