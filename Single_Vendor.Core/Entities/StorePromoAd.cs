using System;
using System.Collections.Generic;

namespace Single_Vendor.Core.Entities;

public partial class StorePromoAd
{
    public int StorePromoAdId { get; set; }

    public int StoreId { get; set; }

    public byte SlotIndex { get; set; }

    public string TitleLine { get; set; } = null!;

    public string BigText { get; set; } = null!;

    public string SubLine { get; set; } = null!;

    public string? LinkUrl { get; set; }

    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; }

    public DateTime UpdatedAtUtc { get; set; }

    public bool ShowOnLanding { get; set; }

    public byte? LandingPosition { get; set; }
}
