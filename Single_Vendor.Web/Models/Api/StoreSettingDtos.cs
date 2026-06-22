namespace Single_Vendor.Web.Models.Api;



public sealed class StoreSettingResponse

{

    public int StoreId { get; set; }

    /// <summary>Public slug for storefront links (<c>?storeSlug=…</c>).</summary>
    public string? PublicStoreSlug { get; set; }

    public string? StoreDisplayName { get; set; }

    public string? LogoUrl { get; set; }

    public string? BannerUrl { get; set; }

    public string? FacebookUrl { get; set; }

    public string? InstagramUrl { get; set; }

    public string? TwitterUrl { get; set; }

    public string? TiktokUrl { get; set; }

    public string? Phone { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }



    public string? PrimaryColorHex { get; set; }

    public string? SecondaryColorHex { get; set; }

    public string? AccentColorHex { get; set; }

    public string? BodyBackgroundHex { get; set; }

    public string? HeaderBackgroundHex { get; set; }

    public string? FooterBackgroundHex { get; set; }

    public string? ButtonColorHex { get; set; }

    public string? LinkColorHex { get; set; }

    /// <summary>Optional modules for this store (storefront + admin).</summary>
    public StoreFeaturesResponse? Features { get; set; }

}



public sealed class StoreSettingUpdateRequest

{

    public string? StoreDisplayName { get; set; }

    public string? LogoUrl { get; set; }

    public string? BannerUrl { get; set; }

    public string? FacebookUrl { get; set; }

    public string? InstagramUrl { get; set; }

    public string? TwitterUrl { get; set; }

    public string? TiktokUrl { get; set; }

    public string? Phone { get; set; }



    public string? PrimaryColorHex { get; set; }

    public string? SecondaryColorHex { get; set; }

    public string? AccentColorHex { get; set; }

    public string? BodyBackgroundHex { get; set; }

    public string? HeaderBackgroundHex { get; set; }

    public string? FooterBackgroundHex { get; set; }

    public string? ButtonColorHex { get; set; }

    public string? LinkColorHex { get; set; }

}

