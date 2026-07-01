using EcommerceWeb.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EcommerceWeb.Web.Controllers.Api;

[ApiController]
[Route("api/my-orders")]
public class MyOrdersController : ControllerBase
{
    private readonly ICustomerOrderService _customerOrderService;

    public MyOrdersController(ICustomerOrderService customerOrderService)
    {
        _customerOrderService = customerOrderService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string userId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return BadRequest(new { message = "User id is required." });
        }

        try
        {
            var orders = await _customerOrderService.GetMyOrdersAsync(userId, cancellationToken);
            return Ok(orders);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, [FromQuery] string userId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return BadRequest(new { message = "User id is required." });
        }

        try
        {
            var order = await _customerOrderService.GetMyOrderByIdAsync(id, userId, cancellationToken);
            return order is null ? NotFound() : Ok(order);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
