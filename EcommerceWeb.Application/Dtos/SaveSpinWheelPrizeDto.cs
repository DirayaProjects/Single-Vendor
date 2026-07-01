namespace EcommerceWeb.Application.Dtos;

public class SaveSpinWheelPrizeDto
{
    public string Label { get; set; } = null!;
    public decimal? DiscountPercent { get; set; }
    public decimal? DiscountAmount { get; set; }
    public int Weight { get; set; } = 1;
    public string? Color { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}
