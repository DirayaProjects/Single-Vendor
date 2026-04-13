using Microsoft.EntityFrameworkCore;
using Single_Vendor.Core.Entities;
using Single_Vendor.Infrastructure.Data;

namespace Single_Vendor.Web.Helpers;

/// <summary>Resolve an active store from public slug or exact display name (case-insensitive).</summary>
public static class StoreResolutionHelper
{
    public static async Task<Store?> ResolveActiveStoreAsync(
        SingleVendorDbContext db,
        string? storeHint,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(storeHint))
            return null;

        var trimmed = storeHint.Trim();
        var normalizedSlug = StoreSlugHelper.NormalizeOrNull(trimmed);
        if (!string.IsNullOrEmpty(normalizedSlug))
        {
            var bySlug = await db.Stores.AsNoTracking()
                .FirstOrDefaultAsync(s => s.PublicSlug == normalizedSlug && s.IsActive, cancellationToken);
            if (bySlug is not null)
                return bySlug;
        }

        var nameLower = trimmed.ToLowerInvariant();
        return await db.Stores.AsNoTracking()
            .FirstOrDefaultAsync(
                s => s.IsActive && s.DisplayName != null && s.DisplayName.ToLower() == nameLower,
                cancellationToken);
    }
}
