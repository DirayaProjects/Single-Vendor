namespace EcommerceWeb.Application.Dtos;

public class FeatureSettingsDto
{
    public bool SpinWheelEnabled { get; set; }
    public bool SpinWheelVisible { get; set; }
    public bool FirstOrderDiscountEnabled { get; set; }
    public decimal? FirstOrderDiscountPercent { get; set; }
    public decimal? FirstOrderDiscountAmount { get; set; }
    public bool GeneralDiscountsEnabled { get; set; }
}
