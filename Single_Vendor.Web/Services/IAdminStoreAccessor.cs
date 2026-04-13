namespace Single_Vendor.Web.Services;

/// <summary>Resolves the storefront (StoreId) owned by the current Admin user.</summary>
public interface IAdminStoreAccessor
{
    /// <returns>null if the user does not own a store row.</returns>
    Task<int?> GetOwnedStoreIdAsync(string? userId, CancellationToken cancellationToken = default);
}
