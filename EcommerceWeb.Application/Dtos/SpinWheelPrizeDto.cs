namespace EcommerceWeb.Application.Dtos;

public class SpinWheelPrizeDto
{
    public int Id { get; set; }
    public string Label { get; set; } = null!;
    public decimal? DiscountPercent { get; set; }
    public decimal? DiscountAmount { get; set; }
    public int Weight { get; set; }
    public string? Color { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
}
