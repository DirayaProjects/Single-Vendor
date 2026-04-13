using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Single_Vendor.Core.Entities;
using Single_Vendor.Infrastructure.Data;
using Single_Vendor.Web.Helpers;
using Single_Vendor.Web.Models.Api;
using Single_Vendor.Web.Services;

namespace Single_Vendor.Web.Controllers.Api;

/// <summary>Edit landing promo slots (1–3) for the signed-in admin&apos;s store.</summary>
[ApiController]
[Route("api/admin/store/promo-ads")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
public class AdminStorePromoAdsController : ControllerBase
{
    private readonly SingleVendorDbContext _db;
    private readonly IAdminStoreAccessor _adminStore;

    public AdminStorePromoAdsController(SingleVendorDbContext db, IAdminStoreAccessor adminStore)
    {
        _db = db;
        _adminStore = adminStore;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<StorePromoAdResponse>>> Get(CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("Your account is not linked to a store.", statusCode: 403);
        if (!await PromoEnabledAsync(storeId.Value, cancellationToken))
            return Problem("Promo / sale spotlight is disabled for this store.", statusCode: 403);

        await EnsureSlotsAsync(storeId.Value, cancellationToken);

        var rows = await _db.StorePromoAds.AsNoTracking()
            .Where(a => a.StoreId == storeId.Value)
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

    [HttpPut]
    public async Task<ActionResult<IReadOnlyList<StorePromoAdResponse>>> Put(
        [FromBody] StorePromoAdsBulkUpdateRequest body,
        CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("Your account is not linked to a store.", statusCode: 403);
        if (!await PromoEnabledAsync(storeId.Value, cancellationToken))
            return Problem("Promo / sale spotlight is disabled for this store.", statusCode: 403);

        await EnsureSlotsAsync(storeId.Value, cancellationToken);

        if (body.Slots is not { Count: > 0 })
            return BadRequest("Slots array is required.");

        foreach (var dto in body.Slots)
        {
            if (dto.SlotIndex is < 1 or > 3)
                return BadRequest("Each slotIndex must be 1, 2, or 3.");
        }

        if (body.Slots.Select(s => s.SlotIndex).Distinct().Count() != 3)
            return BadRequest("Provide exactly three slots with distinct slotIndex values 1–3.");

        var bySlot = body.Slots.ToDictionary(s => s.SlotIndex, s => s);

        var entities = await _db.StorePromoAds
            .Where(a => a.StoreId == storeId.Value)
            .ToListAsync(cancellationToken);

        foreach (var entity in entities)
        {
            if (!bySlot.TryGetValue(entity.SlotIndex, out var dto))
                continue;

            entity.TitleLine = Truncate(dto.TitleLine, entity.TitleLine, 120);
            entity.BigText = Truncate(dto.BigText, entity.BigText, 50);
            entity.SubLine = Truncate(dto.SubLine, entity.SubLine, 120);
            entity.LinkUrl = TruncateNullable(dto.LinkUrl, 1000);
            entity.ImageUrl = TruncateNullable(dto.ImageUrl, 1000);
            if (dto.IsActive.HasValue)
                entity.IsActive = dto.IsActive.Value;
            entity.UpdatedAtUtc = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(cancellationToken);

        var rows = await _db.StorePromoAds.AsNoTracking()
            .Where(a => a.StoreId == storeId.Value)
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

    private static string Truncate(string? incoming, string fallback, int max)
    {
        var v = string.IsNullOrWhiteSpace(incoming) ? fallback : incoming.Trim();
        return v.Length <= max ? v : v[..max];
    }

    private static string? TruncateNullable(string? incoming, int max)
    {
        if (incoming is null)
            return null;
        var v = incoming.Trim();
        if (v.Length == 0)
            return null;
        return v.Length <= max ? v : v[..max];
    }

    private async Task EnsureSlotsAsync(int storeId, CancellationToken cancellationToken)
    {
        var existing = await _db.StorePromoAds
            .Where(a => a.StoreId == storeId)
            .Select(a => a.SlotIndex)
            .ToListAsync(cancellationToken);

        var now = DateTime.UtcNow;
        for (byte slot = 1; slot <= 3; slot++)
        {
            if (existing.Contains(slot))
                continue;
            _db.StorePromoAds.Add(new StorePromoAd
            {
                StoreId = storeId,
                SlotIndex = slot,
                TitleLine = "SALE UP TO",
                BigText = "50%",
                SubLine = "OFF",
                IsActive = true,
                UpdatedAtUtc = now
            });
        }

        await _db.SaveChangesAsync(cancellationToken);
    }

    private async Task<int?> ResolveStoreIdAsync(CancellationToken cancellationToken)
    {
        var uid = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue("sub");
        return await _adminStore.GetOwnedStoreIdAsync(uid, cancellationToken);
    }

    private async Task<bool> PromoEnabledAsync(int storeId, CancellationToken cancellationToken)
    {
        var flags = await _db.StoreFeatureFlags.AsNoTracking()
            .FirstOrDefaultAsync(f => f.StoreId == storeId, cancellationToken);
        return StoreFeaturePolicies.PromoAdsSectionEnabled(flags);
    }
}
