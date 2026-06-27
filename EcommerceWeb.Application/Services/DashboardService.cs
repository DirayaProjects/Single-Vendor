using System.Globalization;
using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Interfaces;
using EcommerceWeb.Core.Interfaces;

namespace EcommerceWeb.Application.Services;

public class DashboardService : IDashboardService
{
    private const int AnalyticsDays = 30;
    private const int TopProductCount = 3;

    private readonly IDashboardRepository _dashboardRepository;

    public DashboardService(IDashboardRepository dashboardRepository)
    {
        _dashboardRepository = dashboardRepository;
    }

    public async Task<DashboardDto> GetDashboardAsync(CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        var since = today.AddDays(-AnalyticsDays);

        var users = await _dashboardRepository.GetUserCountAsync(cancellationToken);
        var products = await _dashboardRepository.GetProductCountAsync(cancellationToken);
        var ordersToday = await _dashboardRepository.GetOrdersCountForDateAsync(today, cancellationToken);
        var revenue = await _dashboardRepository.GetTotalRevenueAsync(cancellationToken);
        var orders = (await _dashboardRepository.GetOrdersSinceAsync(since, cancellationToken)).ToList();
        var orderItems = (await _dashboardRepository.GetOrderItemsSinceAsync(since, cancellationToken)).ToList();

        return new DashboardDto
        {
            Stats = new DashboardStatsDto
            {
                Users = users,
                Products = products,
                OrdersToday = ordersToday,
                Revenue = revenue
            },
            MonthlyRevenueOrders = BuildMonthlyRevenueOrders(orders),
            OrderStatusBreakdown = BuildOrderStatusBreakdown(orders),
            TopSellingProductsOverTime = BuildTopSellingProductsOverTime(orderItems),
            AverageOrderValueTrend = BuildAverageOrderValueTrend(orders),
            CategorySalesOverTime = BuildCategorySalesOverTime(orderItems)
        };
    }

    private static List<MonthlyRevenueOrdersDto> BuildMonthlyRevenueOrders(IReadOnlyList<Core.Entities.Order> orders)
    {
        return orders
            .GroupBy(o => new { o.OrderDate.Year, o.OrderDate.Month })
            .OrderBy(g => g.Key.Year)
            .ThenBy(g => g.Key.Month)
            .Select(g => new MonthlyRevenueOrdersDto
            {
                Month = CultureInfo.CurrentCulture.DateTimeFormat.GetAbbreviatedMonthName(g.Key.Month),
                Revenue = g.Sum(o => o.Total),
                Orders = g.Count()
            })
            .ToList();
    }

    private static List<OrderStatusCountDto> BuildOrderStatusBreakdown(IReadOnlyList<Core.Entities.Order> orders)
    {
        return orders
            .GroupBy(o => o.Status)
            .Select(g => new OrderStatusCountDto
            {
                Name = g.Key,
                Value = g.Count()
            })
            .OrderByDescending(x => x.Value)
            .ToList();
    }

    private static List<SeriesPointDto> BuildTopSellingProductsOverTime(IReadOnlyList<Core.Entities.OrderItem> orderItems)
    {
        if (orderItems.Count == 0)
        {
            return [];
        }

        var topProductNames = orderItems
            .GroupBy(i => i.ProductName)
            .OrderByDescending(g => g.Sum(i => i.Quantity))
            .Take(TopProductCount)
            .Select(g => g.Key)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return orderItems
            .Where(i => topProductNames.Contains(i.ProductName))
            .GroupBy(i => i.Order.OrderDate.Date)
            .OrderBy(g => g.Key)
            .Select(g =>
            {
                var point = new SeriesPointDto
                {
                    Date = g.Key.ToString("yyyy-MM-dd")
                };

                foreach (var productGroup in g.GroupBy(i => i.ProductName))
                {
                    point.Values[productGroup.Key] = productGroup.Sum(i => i.Quantity);
                }

                return point;
            })
            .ToList();
    }

    private static List<SeriesPointDto> BuildAverageOrderValueTrend(IReadOnlyList<Core.Entities.Order> orders)
    {
        return orders
            .GroupBy(o => o.OrderDate.Date)
            .OrderBy(g => g.Key)
            .Select(g => new SeriesPointDto
            {
                Date = g.Key.ToString("yyyy-MM-dd"),
                Values = new Dictionary<string, decimal>
                {
                    ["avg"] = g.Any() ? Math.Round(g.Average(o => o.Total), 2) : 0
                }
            })
            .ToList();
    }

    private static List<SeriesPointDto> BuildCategorySalesOverTime(IReadOnlyList<Core.Entities.OrderItem> orderItems)
    {
        return orderItems
            .Where(i => i.Product?.Category != null)
            .GroupBy(i => i.Order.OrderDate.Date)
            .OrderBy(g => g.Key)
            .Select(g =>
            {
                var point = new SeriesPointDto
                {
                    Date = g.Key.ToString("yyyy-MM-dd")
                };

                foreach (var categoryGroup in g.GroupBy(i => i.Product!.Category!.Name))
                {
                    point.Values[categoryGroup.Key] = categoryGroup.Sum(i => i.LineTotal);
                }

                return point;
            })
            .ToList();
    }
}
