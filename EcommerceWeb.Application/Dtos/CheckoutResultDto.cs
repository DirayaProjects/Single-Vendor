namespace EcommerceWeb.Application.Dtos;

public class CheckoutResultDto
{
    public int OrderId { get; set; }

    public string Status { get; set; } = null!;

    public decimal SubTotal { get; set; }

    public decimal DeliveryFee { get; set; }

    public decimal Total { get; set; }

    public string Date { get; set; } = null!;
}
