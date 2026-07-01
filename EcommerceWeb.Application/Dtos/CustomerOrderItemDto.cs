namespace EcommerceWeb.Application.Dtos;

public class CustomerOrderItemDto
{
    public string ProductName { get; set; } = null!;

    public decimal UnitPrice { get; set; }

    public int Quantity { get; set; }

    public decimal LineTotal { get; set; }
}
