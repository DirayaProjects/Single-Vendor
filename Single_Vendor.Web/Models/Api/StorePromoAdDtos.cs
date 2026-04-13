namespace Single_Vendor.Web.Models.Api;

public sealed class StorePromoAdResponse
{
    public int SlotIndex { get; set; }
    public string TitleLine { get; set; } = "";
    public string BigText { get; set; } = "";
    public string SubLine { get; set; } = "";
    public string? LinkUrl { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; }
}

public sealed class StorePromoAdSlotUpdateDto
{
    public int SlotIndex { get; set; }
    public string? TitleLine { get; set; }
    public string? BigText { get; set; }
    public string? SubLine { get; set; }
    public string? LinkUrl { get; set; }
    public string? ImageUrl { get; set; }
    public bool? IsActive { get; set; }
}

public sealed class StorePromoAdsBulkUpdateRequest
{
    public List<StorePromoAdSlotUpdateDto> Slots { get; set; } = new();
}
