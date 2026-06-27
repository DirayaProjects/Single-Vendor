namespace EcommerceWeb.Application.Dtos;

public class ProductReviewDto
{
    public int Id { get; set; }

    public string Username { get; set; } = null!;

    public decimal Rating { get; set; }

    public string Comment { get; set; } = null!;

    public string? Image { get; set; }
}
