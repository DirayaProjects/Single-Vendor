using System;
using System.Collections.Generic;

namespace Single_Vendor.Core.Entities;

public partial class StoreSetting
{
    public string? StoreDisplayName { get; set; }

    public string? LogoUrl { get; set; }

    public string? BannerUrl { get; set; }

    public string? FacebookUrl { get; set; }

    public string? InstagramUrl { get; set; }

    public string? TwitterUrl { get; set; }

    public string? TiktokUrl { get; set; }

    public string? Phone { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public int StoreId { get; set; }

    public string? PrimaryColorHex { get; set; }

    public string? SecondaryColorHex { get; set; }

    public string? AccentColorHex { get; set; }

    public string? BodyBackgroundHex { get; set; }

    public string? HeaderBackgroundHex { get; set; }

    public string? FooterBackgroundHex { get; set; }

    public string? ButtonColorHex { get; set; }

    public string? LinkColorHex { get; set; }

    public virtual Store Store { get; set; } = null!;
}
