namespace Single_Vendor.Core.Entities;

/// <summary>Landing promo / ad card for a store (slots 1–3).</summary>
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

    public DateTime? UpdatedAtUtc { get; set; }

    public virtual Store Store { get; set; } = null!;
}
