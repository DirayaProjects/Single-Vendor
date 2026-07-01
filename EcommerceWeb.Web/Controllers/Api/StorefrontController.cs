using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EcommerceWeb.Web.Controllers.Api;

[ApiController]
[Route("api/storefront/{slug}")]
public class StorefrontController : ControllerBase
{
    private readonly IStorefrontService _storefrontService;
    private readonly IProductReviewService _productReviewService;
    private readonly IDeliveryCityService _deliveryCityService;
    private readonly ISpinWheelService _spinWheelService;

    public StorefrontController(
        IStorefrontService storefrontService,
        IProductReviewService productReviewService,
        IDeliveryCityService deliveryCityService,
        ISpinWheelService spinWheelService)
    {
        _storefrontService = storefrontService;
        _productReviewService = productReviewService;
        _deliveryCityService = deliveryCityService;
        _spinWheelService = spinWheelService;
    }

    [HttpGet]
    public async Task<IActionResult> GetBootstrap(string slug, CancellationToken cancellationToken)
    {
        var bootstrap = await _storefrontService.GetBootstrapAsync(slug, cancellationToken);
        return bootstrap is null ? NotFound(new { message = "Store not found." }) : Ok(bootstrap);
    }

    [HttpGet("products")]
    public async Task<IActionResult> GetProducts(
        string slug,
        [FromQuery] int? categoryId,
        [FromQuery] string? search,
        CancellationToken cancellationToken)
    {
        var products = await _storefrontService.GetProductsAsync(slug, categoryId, search, cancellationToken);
        if (products.Count == 0 && !await StoreExists(slug, cancellationToken))
        {
            return NotFound(new { message = "Store not found." });
        }

        return Ok(products);
    }

    [HttpGet("products/{id:int}")]
    public async Task<IActionResult> GetProduct(string slug, int id, CancellationToken cancellationToken)
    {
        var product = await _storefrontService.GetProductAsync(slug, id, cancellationToken);
        return product is null ? NotFound(new { message = "Product not found." }) : Ok(product);
    }

    [HttpGet("promo-ads")]
    public async Task<IActionResult> GetPromoAds(string slug, CancellationToken cancellationToken)
    {
        var ads = await _storefrontService.GetPromoAdsAsync(slug, cancellationToken);
        if (ads.Count == 0 && !await StoreExists(slug, cancellationToken))
        {
            return NotFound(new { message = "Store not found." });
        }

        return Ok(ads);
    }

    [HttpGet("delivery-cities")]
    public async Task<IActionResult> GetDeliveryCities(string slug, CancellationToken cancellationToken)
    {
        if (!await StoreExists(slug, cancellationToken))
        {
            return NotFound(new { message = "Store not found." });
        }

        return Ok(await _deliveryCityService.GetActiveAsync(cancellationToken));
    }

    [HttpGet("spin-wheel/status")]
    public async Task<IActionResult> GetSpinWheelStatus(string slug, [FromQuery] string userId, CancellationToken cancellationToken)
    {
        if (!await StoreExists(slug, cancellationToken))
        {
            return NotFound(new { message = "Store not found." });
        }

        if (string.IsNullOrWhiteSpace(userId))
        {
            return BadRequest(new { message = "User id is required." });
        }

        return Ok(await _spinWheelService.GetStatusAsync(userId, cancellationToken));
    }

    [HttpPost("spin-wheel/spin")]
    public async Task<IActionResult> SpinWheel(string slug, [FromBody] SpinRequestDto dto, CancellationToken cancellationToken)
    {
        if (!await StoreExists(slug, cancellationToken))
        {
            return NotFound(new { message = "Store not found." });
        }

        try
        {
            return Ok(await _spinWheelService.SpinAsync(dto.UserId, cancellationToken));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("products/{id:int}/reviews")]
    public async Task<IActionResult> GetProductReviews(string slug, int id, CancellationToken cancellationToken)
    {
        if (!await StoreExists(slug, cancellationToken))
        {
            return NotFound(new { message = "Store not found." });
        }

        var reviews = await _productReviewService.GetReviewsAsync(id, cancellationToken);
        return Ok(reviews);
    }

    [HttpPost("products/{id:int}/reviews")]
    public async Task<IActionResult> SubmitProductReview(
        string slug,
        int id,
        [FromBody] SubmitProductReviewDto dto,
        CancellationToken cancellationToken)
    {
        if (!await StoreExists(slug, cancellationToken))
        {
            return NotFound(new { message = "Store not found." });
        }

        try
        {
            var review = await _productReviewService.SubmitReviewAsync(id, dto, cancellationToken);
            return Ok(review);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private async Task<bool> StoreExists(string slug, CancellationToken cancellationToken)
    {
        var bootstrap = await _storefrontService.GetBootstrapAsync(slug, cancellationToken);
        return bootstrap is not null;
    }
}
