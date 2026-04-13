using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Single_Vendor.Core.Entities;
using Single_Vendor.Infrastructure.Data;
using Single_Vendor.Web.Models.Api;

namespace Single_Vendor.Web.Controllers.Api;

/// <summary>Public storefront branding by store slug.</summary>
[ApiController]
[Route("api/[controller]")]
public class StoreController : ControllerBase
{
    private readonly SingleVendorDbContext _db;

    public StoreController(SingleVendorDbContext db) => _db = db;

    /// <summary>Legacy: first settings row (avoid for multi-tenant; use by-slug).</summary>
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<StoreSettingResponse>> Get(CancellationToken cancellationToken)
    {
        var row = await _db.StoreSettings.AsNoTracking().OrderBy(s => s.StoreId).FirstOrDefaultAsync(cancellationToken);
        if (row is null)
            return Ok(new StoreSettingResponse { StoreId = 1, Features = new StoreFeaturesResponse() });

        var flags = await _db.StoreFeatureFlags.AsNoTracking()
            .FirstOrDefaultAsync(f => f.StoreId == row.StoreId, cancellationToken);
        var slug = await _db.Stores.AsNoTracking()
            .Where(s => s.StoreId == row.StoreId)
            .Select(s => s.PublicSlug)
            .FirstOrDefaultAsync(cancellationToken);
        return Ok(Map(row, flags, slug));
    }

    [AllowAnonymous]
    [HttpGet("suggestions")]
    public async Task<ActionResult<IReadOnlyList<StoreLookupResponse>>> Suggestions([FromQuery] string? q, CancellationToken cancellationToken)
    {
        var term = q?.Trim();
        if (string.IsNullOrWhiteSpace(term) || term.Length < 2)
            return Ok(Array.Empty<StoreLookupResponse>());

        var key = term.ToLowerInvariant();
        var rows = await _db.Stores.AsNoTracking()
            .Where(s => s.IsActive && (
                s.PublicSlug.Contains(key) ||
                (s.DisplayName != null && s.DisplayName.Contains(term))))
            .OrderBy(s => s.DisplayName)
            .ThenBy(s => s.PublicSlug)
            .Select(s => new StoreLookupResponse
            {
                PublicSlug = s.PublicSlug,
                DisplayName = s.DisplayName
            })
            .Take(10)
            .ToListAsync(cancellationToken);

        return Ok(rows);
    }

    [AllowAnonymous]
    [HttpGet("by-slug/{slug}")]
    public async Task<ActionResult<StoreSettingResponse>> GetBySlug(string slug, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(slug))
            return BadRequest();

        var key = slug.Trim().ToLowerInvariant();
        var store = await _db.Stores.AsNoTracking()
            .FirstOrDefaultAsync(s => s.PublicSlug == key && s.IsActive, cancellationToken);
        if (store is null)
            return NotFound();

        var row = await _db.StoreSettings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.StoreId == store.StoreId, cancellationToken);
        var flags = await _db.StoreFeatureFlags.AsNoTracking()
            .FirstOrDefaultAsync(f => f.StoreId == store.StoreId, cancellationToken);
        if (row is null)
        {
            return Ok(new StoreSettingResponse
            {
                StoreId = store.StoreId,
                StoreDisplayName = store.DisplayName,
                PublicStoreSlug = store.PublicSlug,
                Features = StoreFeaturesMapper.ToResponse(flags)
            });
        }

        return Ok(Map(row, flags, store.PublicSlug));
    }

    private static StoreSettingResponse Map(StoreSetting s, StoreFeatureFlag? flags, string? publicStoreSlug = null) => new()
    {
        StoreId = s.StoreId,
        PublicStoreSlug = publicStoreSlug,
        StoreDisplayName = s.StoreDisplayName,
        LogoUrl = s.LogoUrl,
        BannerUrl = s.BannerUrl,
        FacebookUrl = s.FacebookUrl,
        InstagramUrl = s.InstagramUrl,
        TwitterUrl = s.TwitterUrl,
        TiktokUrl = s.TiktokUrl,
        Phone = s.Phone,
        UpdatedAtUtc = s.UpdatedAtUtc,
        PrimaryColorHex = s.PrimaryColorHex,
        SecondaryColorHex = s.SecondaryColorHex,
        AccentColorHex = s.AccentColorHex,
        BodyBackgroundHex = s.BodyBackgroundHex,
        HeaderBackgroundHex = s.HeaderBackgroundHex,
        FooterBackgroundHex = s.FooterBackgroundHex,
        ButtonColorHex = s.ButtonColorHex,
        LinkColorHex = s.LinkColorHex,
        Features = StoreFeaturesMapper.ToResponse(flags)
    };
}
