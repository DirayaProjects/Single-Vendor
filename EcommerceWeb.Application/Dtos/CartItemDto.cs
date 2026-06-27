namespace EcommerceWeb.Application.Dtos;

public class CartItemDto
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public string Name { get; set; } = null!;

    public string? Details { get; set; }

    public decimal Price { get; set; }

    public int Quantity { get; set; }

    public string? Image { get; set; }
}
