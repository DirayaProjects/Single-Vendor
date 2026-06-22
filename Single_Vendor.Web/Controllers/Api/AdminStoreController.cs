using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Single_Vendor.Core.Entities;
using Single_Vendor.Infrastructure.Data;
using Single_Vendor.Web.Models.Api;
using Single_Vendor.Web.Services;

namespace Single_Vendor.Web.Controllers.Api;

/// <summary>Admin update of this tenant's StoreSettings row (theme + branding).</summary>
[ApiController]
[Route("api/admin/store")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
public class AdminStoreController : ControllerBase
{
    private readonly SingleVendorDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly IAdminStoreAccessor _adminStore;
    private readonly ResponsiveImageService _images;

    public AdminStoreController(
        SingleVendorDbContext db,
        IWebHostEnvironment env,
        IAdminStoreAccessor adminStore,
        ResponsiveImageService images)
    {
        _db = db;
        _env = env;
        _adminStore = adminStore;
        _images = images;
    }

    [HttpGet]
    public async Task<ActionResult<StoreSettingResponse>> Get(CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("Your account is not linked to a store. Ask a super admin to recreate your admin with a store slug.", statusCode: 403);

        var row = await _db.StoreSettings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.StoreId == storeId.Value, cancellationToken);
        if (row is null)
            return NotFound();

        var slug = await _db.Stores.AsNoTracking()
            .Where(s => s.StoreId == storeId.Value)
            .Select(s => s.PublicSlug)
            .FirstOrDefaultAsync(cancellationToken);

        var flags = await _db.StoreFeatureFlags.AsNoTracking()
            .FirstOrDefaultAsync(f => f.StoreId == storeId.Value, cancellationToken);

        return Ok(Map(row, slug, flags));
    }

    [HttpPut]
    public async Task<ActionResult<StoreSettingResponse>> Put([FromBody] StoreSettingUpdateRequest body, CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("Your account is not linked to a store.", statusCode: 403);

        var row = await _db.StoreSettings.FirstOrDefaultAsync(s => s.StoreId == storeId.Value, cancellationToken);
        if (row is null)
        {
            row = new StoreSetting { StoreId = storeId.Value };
            _db.StoreSettings.Add(row);
        }

        row.StoreDisplayName = Truncate(body.StoreDisplayName, 200);
        row.LogoUrl = Truncate(body.LogoUrl, 1000);
        row.BannerUrl = Truncate(body.BannerUrl, 1000);
        row.FacebookUrl = Truncate(body.FacebookUrl, 500);
        row.InstagramUrl = Truncate(body.InstagramUrl, 500);
        row.TwitterUrl = Truncate(body.TwitterUrl, 500);
        row.TiktokUrl = Truncate(body.TiktokUrl, 500);
        row.Phone = Truncate(body.Phone, 50);
        row.PrimaryColorHex = Truncate(body.PrimaryColorHex, 16);
        row.SecondaryColorHex = Truncate(body.SecondaryColorHex, 16);
        row.AccentColorHex = Truncate(body.AccentColorHex, 16);
        row.BodyBackgroundHex = Truncate(body.BodyBackgroundHex, 16);
        row.HeaderBackgroundHex = Truncate(body.HeaderBackgroundHex, 16);
        row.FooterBackgroundHex = Truncate(body.FooterBackgroundHex, 16);
        row.ButtonColorHex = Truncate(body.ButtonColorHex, 16);
        row.LinkColorHex = Truncate(body.LinkColorHex, 16);
        row.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        var slug = await _db.Stores.AsNoTracking()
            .Where(s => s.StoreId == storeId.Value)
            .Select(s => s.PublicSlug)
            .FirstOrDefaultAsync(cancellationToken);

        var flags = await _db.StoreFeatureFlags.AsNoTracking()
            .FirstOrDefaultAsync(f => f.StoreId == storeId.Value, cancellationToken);

        return Ok(Map(row, slug, flags));
    }

    /// <summary>Upload logo/banner image; returns a short URL path stored in LogoUrl/BannerUrl (max 1000).</summary>
    [HttpPost("upload-image")]
    public async Task<IActionResult> UploadImage(IFormFile? file, CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("Your account is not linked to a store.", statusCode: 403);

        if (file == null || file.Length == 0)
            return BadRequest("File required.");

        var url = await _images.SaveWebpVariantsAsync(
            file,
            _env.WebRootPath,
            $"uploads/store-branding/{storeId.Value}",
            Guid.NewGuid().ToString("N"),
            Request.PathBase,
            cancellationToken);
        return Ok(new { url });
    }

    private async Task<int?> ResolveStoreIdAsync(CancellationToken cancellationToken)
    {
        var uid = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue("sub");
        return await _adminStore.GetOwnedStoreIdAsync(uid, cancellationToken);
    }

    private static StoreSettingResponse Map(StoreSetting s, string? publicStoreSlug = null, StoreFeatureFlag? flags = null) => new()
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

    private static string? Truncate(string? value, int max)
    {
        if (string.IsNullOrEmpty(value)) return value;
        return value.Length <= max ? value : value[..max];
    }
}
