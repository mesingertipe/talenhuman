using MediatR;
using Microsoft.EntityFrameworkCore;
using TalenHuman.Application.Common.Interfaces;
using TalenHuman.Domain.Entities;

namespace TalenHuman.Application.Employees;

public record CreateEmployeeCommand : IRequest<Guid>
{
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string IdentificationNumber { get; init; } = string.Empty;
    public Guid StoreId { get; init; }
    public Guid ProfileId { get; set; }
    public Guid? JornadaId { get; set; }
    public DateTime? BirthDate { get; set; }
    public DateTime DateOfEntry { get; init; }
    public decimal DailySalary { get; init; }
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

        // Check for existing identification number (Cédula)
        var exists = await _context.Employees
            .IgnoreQueryFilters() // check globally to prevent Identity conflicts
            .AnyAsync(x => x.IdentificationNumber == request.IdentificationNumber, cancellationToken);
            
        if (exists)
        {
            throw new Exception($"El número de identificación {request.IdentificationNumber} ya se encuentra registrado en el sistema.");
        }

        var generatedEmail = $"{request.IdentificationNumber}@talenhuman.local";

        var employee = new Employee
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = generatedEmail,
            IdentificationNumber = request.IdentificationNumber,
            BirthDate = request.BirthDate,
            StoreId = request.StoreId,
            ProfileId = request.ProfileId,
            JornadaId = request.JornadaId,
            CompanyId = companyId,
            DateOfEntry = request.DateOfEntry,
            DailySalary = request.DailySalary,
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
