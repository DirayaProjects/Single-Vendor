namespace EcommerceWeb.Application.Dtos;

public class SpinWheelStatusDto
{
    public bool Enabled { get; set; }
    public bool Visible { get; set; }
    public bool CanSpin { get; set; }
    public bool HasUnusedPrize { get; set; }
    public SpinWheelPrizeDto? UnusedPrize { get; set; }
    public IReadOnlyList<SpinWheelPrizeDto> Prizes { get; set; } = Array.Empty<SpinWheelPrizeDto>();
}
