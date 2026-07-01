namespace EcommerceWeb.Application.Dtos;

public class SaveDeliveryCityDto
{
    public string Name { get; set; } = null!;
    public decimal DeliveryFee { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}
