namespace EcommerceWeb.Application.Dtos;

public class CustomerOrderDto
{
    public int Id { get; set; }

    public string Status { get; set; } = null!;

    public decimal SubTotal { get; set; }

    public decimal DeliveryFee { get; set; }

    public decimal Total { get; set; }

    public string Date { get; set; } = null!;

    public string? Description { get; set; }

    public IReadOnlyList<CustomerOrderItemDto> Items { get; set; } = Array.Empty<CustomerOrderItemDto>();
}
