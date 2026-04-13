using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Single_Vendor.Infrastructure.Data;
using Single_Vendor.Web.Helpers;
using Single_Vendor.Web.Models.Api;

namespace Single_Vendor.Web.Controllers.Api;

[ApiController]
[Route("api/storefront/promo-ads")]
public class StorefrontPromoAdsController : ControllerBase
{
    private readonly SingleVendorDbContext _db;

    public StorefrontPromoAdsController(SingleVendorDbContext db) => _db = db;

    /// <summary>Active landing promo cards for a store (empty when feature off or no rows).</summary>
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<StorePromoAdResponse>>> List(
        [FromQuery] string? storeSlug,
        CancellationToken cancellationToken)
    {
        var slug = StoreSlugHelper.NormalizeOrNull(storeSlug);
        if (string.IsNullOrEmpty(slug))
            return Ok(Array.Empty<StorePromoAdResponse>());

        var store = await _db.Stores.AsNoTracking()
            .FirstOrDefaultAsync(s => s.PublicSlug == slug && s.IsActive, cancellationToken);
        if (store is null)
            return Ok(Array.Empty<StorePromoAdResponse>());

        var flags = await _db.StoreFeatureFlags.AsNoTracking()
            .FirstOrDefaultAsync(f => f.StoreId == store.StoreId, cancellationToken);
        if (!StoreFeaturePolicies.PromoAdsSectionEnabled(flags))
            return Ok(Array.Empty<StorePromoAdResponse>());

        var rows = await _db.StorePromoAds.AsNoTracking()
            .Where(a => a.StoreId == store.StoreId && a.IsActive)
            .OrderBy(a => a.SlotIndex)
            .Select(a => new StorePromoAdResponse
            {
                SlotIndex = a.SlotIndex,
                TitleLine = a.TitleLine,
                BigText = a.BigText,
                SubLine = a.SubLine,
                LinkUrl = a.LinkUrl,
                ImageUrl = a.ImageUrl,
                IsActive = a.IsActive
            })
            .ToListAsync(cancellationToken);

        return Ok(rows);
    }
}
