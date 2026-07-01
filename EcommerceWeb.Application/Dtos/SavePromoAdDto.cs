namespace EcommerceWeb.Application.Dtos;

public class SavePromoAdDto
{
    public string Title { get; set; } = null!;
    public string? Subtitle { get; set; }
    public string? Description { get; set; }
    public string? Image { get; set; }
    public string? LinkUrl { get; set; }
    public string? ButtonText { get; set; }
    public string? StartDate { get; set; }
    public string? EndDate { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}
