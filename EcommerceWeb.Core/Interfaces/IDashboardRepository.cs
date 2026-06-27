using EcommerceWeb.Core.Entities;

namespace EcommerceWeb.Core.Interfaces;

public interface IDashboardRepository
{
    Task<int> GetUserCountAsync(CancellationToken cancellationToken = default);

    Task<int> GetProductCountAsync(CancellationToken cancellationToken = default);

    Task<int> GetOrdersCountForDateAsync(DateTime date, CancellationToken cancellationToken = default);

    Task<decimal> GetTotalRevenueAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Order>> GetOrdersSinceAsync(DateTime since, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<OrderItem>> GetOrderItemsSinceAsync(DateTime since, CancellationToken cancellationToken = default);
}
