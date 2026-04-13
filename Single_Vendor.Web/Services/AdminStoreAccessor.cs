using Microsoft.EntityFrameworkCore;
using Single_Vendor.Infrastructure.Data;

namespace Single_Vendor.Web.Services;

public sealed class AdminStoreAccessor : IAdminStoreAccessor
{
    private readonly SingleVendorDbContext _db;

    public AdminStoreAccessor(SingleVendorDbContext db) => _db = db;

    public async Task<int?> GetOwnedStoreIdAsync(string? userId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(userId))
            return null;

        var ownedStoreId = await _db.Stores.AsNoTracking()
            .Where(s => s.OwnerUserId == userId)
            .Select(s => (int?)s.StoreId)
            .FirstOrDefaultAsync(cancellationToken);
        if (ownedStoreId.HasValue)
            return ownedStoreId;

        // Backward compatibility: some older admin users were linked via AspNetUsers.StoreId only.
        var linkedStoreId = await _db.AspNetUsers.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.StoreId)
            .FirstOrDefaultAsync(cancellationToken);
        if (!linkedStoreId.HasValue)
            return null;

        var exists = await _db.Stores.AsNoTracking()
            .AnyAsync(s => s.StoreId == linkedStoreId.Value, cancellationToken);
        return exists ? linkedStoreId : null;
    }
}
