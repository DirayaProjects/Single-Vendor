namespace Single_Vendor.Web.Models.Api;

public sealed class CreateStoreAdminRequest
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";

    /// <summary>URL segment for the public shop, e.g. "acme" → share /s/acme (lowercase letters, digits, hyphen).</summary>
    public string PublicSlug { get; set; } = "";

    /// <summary>Optional display name for the store row.</summary>
    public string? DisplayName { get; set; }

    /// <summary>
    /// When omitted, the new store gets every feature enabled (same as legacy).
    /// When present, each flag defaults to <c>false</c> unless set to <c>true</c> in JSON.
    /// </summary>
    public StoreFeaturesUpsertDto? Features { get; set; }
}

public sealed class StoreAdminUserResponse
{
    public string Id { get; set; } = "";
    public string? Email { get; set; }
    public string? UserName { get; set; }
    public bool EmailConfirmed { get; set; }
    public bool LockoutEnabled { get; set; }
    public DateTimeOffset? LockoutEnd { get; set; }

    public int? StoreId { get; set; }
    public string? PublicSlug { get; set; }
    public string? StoreDisplayName { get; set; }
    public StoreFeaturesResponse? Features { get; set; }
}

public sealed class UpdateStoreAdminRequest
{
    public string PublicSlug { get; set; } = "";
    public string? DisplayName { get; set; }
    public StoreFeaturesUpsertDto? Features { get; set; }
}

public sealed class SuperAdminStatsResponse
{
    public int StoreAdminCount { get; set; }
    public int SuperAdminCount { get; set; }
    public int CustomerCount { get; set; }
}
