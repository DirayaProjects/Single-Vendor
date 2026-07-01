namespace EcommerceWeb.Application.Dtos;

public class SaveGeneralDiscountDto
{
    public string Name { get; set; } = null!;
    public decimal? DiscountPercent { get; set; }
    public decimal? DiscountAmount { get; set; }
    public bool IsActive { get; set; } = true;
    public string? StartDate { get; set; }
    public string? EndDate { get; set; }
    public List<int> ProductIds { get; set; } = [];
}
