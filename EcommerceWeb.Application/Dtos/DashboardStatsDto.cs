namespace EcommerceWeb.Application.Dtos;

public class DashboardStatsDto
{
    public int Users { get; set; }

    public int OrdersToday { get; set; }

    public decimal Revenue { get; set; }

    public int Products { get; set; }
}
