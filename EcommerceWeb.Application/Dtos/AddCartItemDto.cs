namespace EcommerceWeb.Application.Dtos;

public class AddCartItemDto
{
    public string UserId { get; set; } = null!;

    public int ProductId { get; set; }

    public int Quantity { get; set; } = 1;

    public Dictionary<string, string> SelectedAttributes { get; set; } = [];
}
