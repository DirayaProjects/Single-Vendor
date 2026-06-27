namespace EcommerceWeb.Application.Dtos;

public class DashboardDto
{
    public DashboardStatsDto Stats { get; set; } = new();

    public List<MonthlyRevenueOrdersDto> MonthlyRevenueOrders { get; set; } = [];

    public List<OrderStatusCountDto> OrderStatusBreakdown { get; set; } = [];

    public List<SeriesPointDto> TopSellingProductsOverTime { get; set; } = [];

    public List<SeriesPointDto> AverageOrderValueTrend { get; set; } = [];

    public List<SeriesPointDto> CategorySalesOverTime { get; set; } = [];
}
