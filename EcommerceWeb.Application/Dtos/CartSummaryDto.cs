namespace EcommerceWeb.Application.Dtos;

public class CartSummaryDto
{
    public List<CartItemDto> Items { get; set; } = [];

    public decimal Subtotal { get; set; }

    public int ItemCount { get; set; }
}
