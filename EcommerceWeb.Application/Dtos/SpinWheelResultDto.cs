namespace EcommerceWeb.Application.Dtos;

public class SpinWheelResultDto
{
    public int ResultId { get; set; }
    public SpinWheelPrizeDto Prize { get; set; } = null!;
}
