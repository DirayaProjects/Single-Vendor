using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EcommerceWeb.Web.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
public class CheckoutController : ControllerBase
{
    private readonly ICheckoutService _checkoutService;

    public CheckoutController(ICheckoutService checkoutService)
    {
        _checkoutService = checkoutService;
    }

    [HttpPost("preview")]
    public async Task<IActionResult> Preview([FromBody] CheckoutRequestDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.UserId))
        {
            return BadRequest(new { message = "User id is required." });
        }

        try
        {
            return Ok(await _checkoutService.PreviewAsync(dto, cancellationToken));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> PlaceOrder([FromBody] CheckoutRequestDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.UserId))
        {
            return BadRequest(new { message = "User id is required." });
        }

        try
        {
            var result = await _checkoutService.CheckoutAsync(dto, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
