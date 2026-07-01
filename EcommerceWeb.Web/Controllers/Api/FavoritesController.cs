using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EcommerceWeb.Web.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
public class FavoritesController : ControllerBase
{
    private readonly IFavoriteService _favoriteService;

    public FavoritesController(IFavoriteService favoriteService)
    {
        _favoriteService = favoriteService;
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
            var favorites = await _favoriteService.GetFavoritesAsync(userId, cancellationToken);
            return Ok(favorites);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("toggle")]
    public async Task<IActionResult> Toggle([FromBody] ToggleFavoriteDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var favorites = await _favoriteService.ToggleAsync(dto, cancellationToken);
            return Ok(favorites);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
