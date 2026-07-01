namespace EcommerceWeb.Application.Dtos;

public class CheckoutPreviewDto
{
    public decimal SubTotal { get; set; }
    public decimal ProductSaleDiscount { get; set; }
    public decimal GeneralDiscount { get; set; }
    public decimal SpinWheelDiscount { get; set; }
    public decimal FirstOrderDiscount { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal DeliveryFee { get; set; }
    public decimal Total { get; set; }
    public string? DeliveryCityName { get; set; }
    public bool HasUnusedSpinPrize { get; set; }
    public bool EligibleForFirstOrderDiscount { get; set; }
}
