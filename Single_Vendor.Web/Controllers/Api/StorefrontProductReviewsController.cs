using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Single_Vendor.Core.Entities;
using Single_Vendor.Infrastructure.Data;
using Single_Vendor.Web.Helpers;

namespace Single_Vendor.Web.Controllers.Api;

[ApiController]
[Route("api/storefront/products")]
public class StorefrontProductReviewsController : ControllerBase
{
    private readonly SingleVendorDbContext _db;

    public StorefrontProductReviewsController(SingleVendorDbContext db) => _db = db;

    public sealed class SubmitReviewRequest
    {
        public string? StoreSlug { get; set; }
        public byte Rating { get; set; }
        public string? Comment { get; set; }
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Customer")]
    [HttpPost("{productId:int}/reviews")]
    public async Task<IActionResult> Submit(int productId, [FromBody] SubmitReviewRequest body, CancellationToken cancellationToken)
    {
        var uid = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue("sub");
        if (string.IsNullOrEmpty(uid))
            return Unauthorized();

        if (body.Rating is < 1 or > 5)
            return BadRequest("Rating must be between 1 and 5.");

        var slug = StoreSlugHelper.NormalizeOrNull(body.StoreSlug);
        if (string.IsNullOrEmpty(slug))
            return BadRequest("Store is required.");

        var store = await _db.Stores.AsNoTracking()
            .FirstOrDefaultAsync(s => s.PublicSlug == slug && s.IsActive, cancellationToken);
        if (store is null)
            return BadRequest("Unknown or inactive store.");

        var flags = await _db.StoreFeatureFlags.AsNoTracking()
            .FirstOrDefaultAsync(f => f.StoreId == store.StoreId, cancellationToken);
        if (!StoreFeaturePolicies.CustomerReviewsEnabled(flags))
            return Problem("Product reviews are disabled for this store.", statusCode: 403);

        var customerStoreId = await _db.AspNetUsers.AsNoTracking()
            .Where(u => u.Id == uid)
            .Select(u => u.StoreId)
            .FirstOrDefaultAsync(cancellationToken);
        if (customerStoreId != store.StoreId)
            return Forbid();

        var product = await _db.Products.FirstOrDefaultAsync(
            p => p.ProductId == productId && p.StoreId == store.StoreId && p.IsActive,
            cancellationToken);
        if (product is null)
            return NotFound();

        var comment = string.IsNullOrWhiteSpace(body.Comment) ? null : body.Comment.Trim();
        if (comment is { Length: > 2000 })
            comment = comment[..2000];

        var existing = await _db.ProductReviews.FirstOrDefaultAsync(
            r => r.ProductId == productId && r.UserId == uid,
            cancellationToken);

        if (existing is null)
        {
            _db.ProductReviews.Add(new ProductReview
            {
                ProductId = productId,
                StoreId = product.StoreId,
                UserId = uid,
                Rating = body.Rating,
                Comment = comment,
                CreatedAtUtc = DateTime.UtcNow
            });
        }
        else
        {
            existing.StoreId = product.StoreId;
            existing.Rating = body.Rating;
            existing.Comment = comment;
            existing.CreatedAtUtc = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(cancellationToken);
        await RefreshProductRatingAsync(productId, cancellationToken);

        var updated = await _db.Products.AsNoTracking()
            .Where(p => p.ProductId == productId)
            .Select(p => new { p.RatingAverage, p.RatingCount })
            .FirstAsync(cancellationToken);

        return Ok(new { ratingAverage = (double)updated.RatingAverage, ratingCount = updated.RatingCount, yourRating = (int)body.Rating });
    }

    /// <summary>Public reviews for a product (for product detail). Empty when ratings and reviews are both disabled.</summary>
    [AllowAnonymous]
    [HttpGet("{productId:int}/reviews")]
    public async Task<IActionResult> ListForProduct(
        int productId,
        [FromQuery] string? storeSlug,
        [FromQuery] int take = 50,
        CancellationToken cancellationToken = default)
    {
        var slug = StoreSlugHelper.NormalizeOrNull(storeSlug);
        if (string.IsNullOrEmpty(slug))
            return Ok(Array.Empty<object>());

        var store = await _db.Stores.AsNoTracking()
            .FirstOrDefaultAsync(s => s.PublicSlug == slug && s.IsActive, cancellationToken);
        if (store is null)
            return Ok(Array.Empty<object>());

        var flags = await _db.StoreFeatureFlags.AsNoTracking()
            .FirstOrDefaultAsync(f => f.StoreId == store.StoreId, cancellationToken);
        if (!StoreFeaturePolicies.RatingStarsEnabled(flags) && !StoreFeaturePolicies.CustomerReviewsEnabled(flags))
            return Ok(Array.Empty<object>());

        var productOk = await _db.Products.AsNoTracking()
            .AnyAsync(p => p.ProductId == productId && p.StoreId == store.StoreId && p.IsActive, cancellationToken);
        if (!productOk)
            return NotFound();

        take = Math.Clamp(take, 1, 100);

        var list = await (from r in _db.ProductReviews.AsNoTracking()
                          join u in _db.AspNetUsers.AsNoTracking() on r.UserId equals u.Id into userJoin
                          from u in userJoin.DefaultIfEmpty()
                          where r.ProductId == productId && (r.StoreId == store.StoreId || r.StoreId == null)
                          orderby r.CreatedAtUtc descending
                          select new
                          {
                              r.ProductReviewId,
                              username = u != null ? (u.UserName ?? u.Email ?? "Customer") : "Customer",
                              rating = (double)r.Rating,
                              comment = r.Comment ?? "",
                              r.CreatedAtUtc
                          })
            .Take(take)
            .ToListAsync(cancellationToken);

        return Ok(list);
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Customer")]
    [HttpGet("{productId:int}/reviews/me")]
    public async Task<IActionResult> MyReview(int productId, [FromQuery] string? storeSlug, CancellationToken cancellationToken)
    {
        var uid = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue("sub");
        if (string.IsNullOrEmpty(uid))
            return Unauthorized();

        var slug = StoreSlugHelper.NormalizeOrNull(storeSlug);
        if (string.IsNullOrEmpty(slug))
            return Ok(new { rating = (int?)null });

        var store = await _db.Stores.AsNoTracking()
            .FirstOrDefaultAsync(s => s.PublicSlug == slug && s.IsActive, cancellationToken);
        if (store is null)
            return Ok(new { rating = (int?)null });

        var flags = await _db.StoreFeatureFlags.AsNoTracking()
            .FirstOrDefaultAsync(f => f.StoreId == store.StoreId, cancellationToken);
        if (!StoreFeaturePolicies.CustomerReviewsEnabled(flags))
            return Ok(new { rating = (int?)null });

        var customerStoreId = await _db.AspNetUsers.AsNoTracking()
            .Where(u => u.Id == uid)
            .Select(u => u.StoreId)
            .FirstOrDefaultAsync(cancellationToken);
        if (customerStoreId != store.StoreId)
            return Ok(new { rating = (int?)null });

        var exists = await _db.Products.AsNoTracking()
            .AnyAsync(p => p.ProductId == productId && p.StoreId == store.StoreId && p.IsActive, cancellationToken);
        if (!exists)
            return NotFound();

        var r = await _db.ProductReviews.AsNoTracking()
            .Where(x =>
                x.ProductId == productId
                && x.UserId == uid
                && (x.StoreId == store.StoreId || x.StoreId == null))
            .Select(x => new { x.Rating })
            .FirstOrDefaultAsync(cancellationToken);

        return Ok(new { rating = r is null ? (int?)null : r.Rating });
    }

    private async Task RefreshProductRatingAsync(int productId, CancellationToken cancellationToken)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.ProductId == productId, cancellationToken);
        if (product is null)
            return;

        var storeId = product.StoreId;

        var count = await _db.ProductReviews.AsNoTracking()
            .CountAsync(
                r => r.ProductId == productId && (r.StoreId == null || r.StoreId == storeId),
                cancellationToken);

        if (count == 0)
        {
            product.RatingAverage = 0;
            product.RatingCount = 0;
        }
        else
        {
            var sum = await _db.ProductReviews.AsNoTracking()
                .Where(r => r.ProductId == productId && (r.StoreId == null || r.StoreId == storeId))
                .SumAsync(r => (int)r.Rating, cancellationToken);
            product.RatingAverage = (decimal)Math.Round(sum / (double)count, 2, MidpointRounding.AwayFromZero);
            product.RatingCount = count;
        }

        await _db.SaveChangesAsync(cancellationToken);
    }
}
