namespace EcommerceWeb.Application.Dtos;

public class UpdateCartItemDto
{
    public string UserId { get; set; } = null!;

    public int Quantity { get; set; }
}
