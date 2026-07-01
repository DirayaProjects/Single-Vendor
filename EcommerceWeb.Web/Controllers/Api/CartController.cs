using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EcommerceWeb.Web.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
public class CartController : ControllerBase
{
    private readonly ICartService _cartService;
    private readonly ILogger<CartController> _logger;

    public CartController(ICartService cartService, ILogger<CartController> logger)
    {
        _cartService = cartService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string userId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return BadRequest(new { message = "User id is required." });
        }

        try
        {
            var cart = await _cartService.GetCartAsync(userId, cancellationToken);
            return Ok(cart);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] AddCartItemDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var cart = await _cartService.AddItemAsync(dto, cancellationToken);
            return Ok(cart);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Cart add failed for user {UserId} product {ProductId}", dto.UserId, dto.ProductId);
            return StatusCode(500, new { message = "Could not save cart item. Restart the app after database updates, then try again." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Cart add failed for user {UserId} product {ProductId}", dto.UserId, dto.ProductId);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCartItemDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var cart = await _cartService.UpdateItemAsync(id, dto, cancellationToken);
            return cart is null ? NotFound() : Ok(cart);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Remove(int id, [FromQuery] string userId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return BadRequest(new { message = "User id is required." });
        }

        try
        {
            var cart = await _cartService.RemoveItemAsync(id, userId, cancellationToken);
            return cart is null ? NotFound() : Ok(cart);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
