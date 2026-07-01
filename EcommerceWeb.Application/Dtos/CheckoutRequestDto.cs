namespace EcommerceWeb.Application.Dtos;

public class CheckoutRequestDto
{
    public string UserId { get; set; } = null!;

    public string CustomerName { get; set; } = null!;

    public string CustomerPhone { get; set; } = null!;

    public string CustomerEmail { get; set; } = null!;

    public string CustomerAddress { get; set; } = null!;

    public int DeliveryCityId { get; set; }

    public string? Description { get; set; }

    public bool ApplySpinWheelPrize { get; set; } = true;
}
