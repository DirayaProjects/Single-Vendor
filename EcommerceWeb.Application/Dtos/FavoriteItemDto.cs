namespace EcommerceWeb.Application.Dtos;

public class FavoriteItemDto
{
    public int ProductId { get; set; }

    public string Name { get; set; } = null!;

    public string? Details { get; set; }

    public decimal Price { get; set; }

    public string? Image { get; set; }

    public decimal Rating { get; set; }
}
