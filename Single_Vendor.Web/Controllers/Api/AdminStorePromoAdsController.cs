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
            .OrderByDescending(a => a.ShowOnLanding)
            .ThenBy(a => a.LandingPosition ?? 99)
            .ThenBy(a => a.SlotIndex)
            .Select(a => new StorePromoAdResponse
            {
                StorePromoAdId = a.StorePromoAdId,
                SlotIndex = a.SlotIndex,
                TitleLine = a.TitleLine,
                BigText = a.BigText,
                SubLine = a.SubLine,
                LinkUrl = a.LinkUrl,
                ImageUrl = a.ImageUrl,
                IsActive = a.IsActive,
                ShowOnLanding = a.ShowOnLanding,
                LandingPosition = a.LandingPosition
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

        if (body.Slots is null)
            return BadRequest("Slots array is required.");
        if (body.Slots.Count == 0)
            return BadRequest("Provide at least one promo row.");

        foreach (var dto in body.Slots)
        {
            if (dto.SlotIndex < 1)
                return BadRequest("Each slotIndex must be >= 1.");
            if (dto.SlotIndex > byte.MaxValue)
                return BadRequest($"slotIndex cannot be greater than {byte.MaxValue}.");
        }

        if (body.Slots.Select(s => s.SlotIndex).Distinct().Count() != body.Slots.Count)
            return BadRequest("slotIndex values must be distinct.");

        var requestedLanding = body.Slots
            .Where(s => (s.ShowOnLanding ?? false) && (s.IsActive ?? true))
            .ToList();
        if (requestedLanding.Count > 3)
            return BadRequest("At most 3 promos can be marked for landing.");
        var requestedLandingPositions = requestedLanding
            .Where(s => s.LandingPosition is >= 1 and <= 3)
            .Select(s => s.LandingPosition!.Value)
            .ToList();
        if (requestedLandingPositions.Count != requestedLanding.Select(s => s.LandingPosition).Count())
            return BadRequest("Landing promos must have landingPosition 1, 2, or 3.");
        if (requestedLandingPositions.Distinct().Count() != requestedLandingPositions.Count)
            return BadRequest("Landing positions must be unique (1..3).");

        var bySlot = body.Slots.ToDictionary(s => s.SlotIndex, s => s);

        var entities = await _db.StorePromoAds
            .Where(a => a.StoreId == storeId.Value)
            .ToListAsync(cancellationToken);
        var existingBySlot = entities.ToDictionary(e => (int)e.SlotIndex, e => e);

        foreach (var dto in body.Slots)
        {
            var active = dto.IsActive ?? true;
            var showOnLanding = active && (dto.ShowOnLanding ?? false);
            byte? landingPosition = null;
            if (showOnLanding && dto.LandingPosition is >= 1 and <= 3)
                landingPosition = (byte)dto.LandingPosition.Value;

            if (existingBySlot.TryGetValue(dto.SlotIndex, out var entity))
            {
                entity.TitleLine = NormalizeNonNull(dto.TitleLine, 120);
                entity.BigText = NormalizeNonNull(dto.BigText, 50);
                entity.SubLine = NormalizeNonNull(dto.SubLine, 120);
                entity.LinkUrl = TruncateNullable(dto.LinkUrl, 1000);
                entity.ImageUrl = TruncateNullable(dto.ImageUrl, 1000);
                entity.IsActive = active;
                entity.ShowOnLanding = showOnLanding;
                entity.LandingPosition = landingPosition;
                entity.UpdatedAtUtc = DateTime.UtcNow;
                continue;
            }

            _db.StorePromoAds.Add(new StorePromoAd
            {
                StoreId = storeId.Value,
                SlotIndex = checked((byte)dto.SlotIndex),
                TitleLine = NormalizeNonNull(dto.TitleLine, 120),
                BigText = NormalizeNonNull(dto.BigText, 50),
                SubLine = NormalizeNonNull(dto.SubLine, 120),
                LinkUrl = TruncateNullable(dto.LinkUrl, 1000),
                ImageUrl = TruncateNullable(dto.ImageUrl, 1000),
                IsActive = active,
                ShowOnLanding = showOnLanding,
                LandingPosition = landingPosition,
                UpdatedAtUtc = DateTime.UtcNow
            });
        }

        var incomingSlotSet = bySlot.Keys.ToHashSet();
        var toDelete = entities.Where(e => !incomingSlotSet.Contains(e.SlotIndex)).ToList();
        if (toDelete.Count > 0)
            _db.StorePromoAds.RemoveRange(toDelete);

        await _db.SaveChangesAsync(cancellationToken);

        var rows = await _db.StorePromoAds.AsNoTracking()
            .Where(a => a.StoreId == storeId.Value)
            .OrderByDescending(a => a.ShowOnLanding)
            .ThenBy(a => a.LandingPosition ?? 99)
            .ThenBy(a => a.SlotIndex)
            .Select(a => new StorePromoAdResponse
            {
                StorePromoAdId = a.StorePromoAdId,
                SlotIndex = a.SlotIndex,
                TitleLine = a.TitleLine,
                BigText = a.BigText,
                SubLine = a.SubLine,
                LinkUrl = a.LinkUrl,
                ImageUrl = a.ImageUrl,
                IsActive = a.IsActive,
                ShowOnLanding = a.ShowOnLanding,
                LandingPosition = a.LandingPosition
            })
            .ToListAsync(cancellationToken);

        return Ok(rows);
    }

    private static string NormalizeNonNull(string? incoming, int max)
    {
        var v = string.IsNullOrWhiteSpace(incoming) ? "" : incoming.Trim();
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
            .Select(a => a.StorePromoAdId)
            .ToListAsync(cancellationToken);
        if (existing.Count > 0)
            return;

        var now = DateTime.UtcNow;
        for (byte slot = 1; slot <= 3; slot++)
        {
            _db.StorePromoAds.Add(new StorePromoAd
            {
                StoreId = storeId,
                SlotIndex = slot,
                TitleLine = "SALE UP TO",
                BigText = "50%",
                SubLine = "OFF",
                IsActive = true,
                ShowOnLanding = true,
                LandingPosition = slot,
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
