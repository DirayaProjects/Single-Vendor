namespace EcommerceWeb.Application.Dtos;

public class DeliveryCityDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public decimal DeliveryFee { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
}
