namespace EcommerceWeb.Application.Dtos;

public class GeneralDiscountDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public decimal? DiscountPercent { get; set; }
    public decimal? DiscountAmount { get; set; }
    public bool IsActive { get; set; }
    public string? StartDate { get; set; }
    public string? EndDate { get; set; }
    public IReadOnlyList<int> ProductIds { get; set; } = Array.Empty<int>();
}
