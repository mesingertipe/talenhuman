using MediatR;
using Microsoft.AspNetCore.Mvc;
using TalenHuman.Application.Employees;

namespace TalenHuman.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly IMediator _mediator;

    public EmployeesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<ActionResult<Guid>> Create(CreateEmployeeCommand command)
    {
        return await _mediator.Send(command);
    }
}
