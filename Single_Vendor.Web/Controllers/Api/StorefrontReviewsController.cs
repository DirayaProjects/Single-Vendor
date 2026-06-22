using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Single_Vendor.Infrastructure.Data;
using Single_Vendor.Web.Helpers;

namespace Single_Vendor.Web.Controllers.Api;

[ApiController]
[Route("api/storefront/reviews")]
public class StorefrontReviewsController : ControllerBase
{
    private readonly SingleVendorDbContext _db;

    public StorefrontReviewsController(SingleVendorDbContext db) => _db = db;

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? storeSlug, [FromQuery] int take = 40, CancellationToken cancellationToken = default)
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
        if (!StoreFeaturePolicies.TestimonialsEnabled(flags))
            return Ok(Array.Empty<object>());

        take = Math.Clamp(take, 1, 100);

        var list = await (from r in _db.ProductReviews.AsNoTracking()
                          join p in _db.Products.AsNoTracking() on r.ProductId equals p.ProductId
                          join u in _db.AspNetUsers.AsNoTracking() on r.UserId equals u.Id into userJoin
                          from u in userJoin.DefaultIfEmpty()
                          where r.StoreId == store.StoreId || (r.StoreId == null && p.StoreId == store.StoreId)
                          orderby r.CreatedAtUtc descending
                          select new
                          {
                              r.ProductReviewId,
                              username = u != null ? (u.UserName ?? u.Email ?? "Customer") : "Customer",
                              rating = (double)r.Rating,
                              comment = r.Comment ?? "",
                              productName = p.Name,
                              r.CreatedAtUtc
                          })
            .Take(take)
            .ToListAsync(cancellationToken);

        return Ok(list);
    }
}
