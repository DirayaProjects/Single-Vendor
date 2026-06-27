using EcommerceWeb.Core.Interfaces;
using EcommerceWeb.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EcommerceWeb.Infrastructure.Repositories;

public class DashboardRepository : IDashboardRepository
{
    private readonly EcommerceWebDbContext _context;

    public DashboardRepository(EcommerceWebDbContext context)
    {
        _context = context;
    }

    public Task<int> GetUserCountAsync(CancellationToken cancellationToken = default)
    {
        return _context.AspNetUsers.CountAsync(cancellationToken);
    }

    public Task<int> GetProductCountAsync(CancellationToken cancellationToken = default)
    {
        return _context.Products.CountAsync(cancellationToken);
    }

    public Task<int> GetOrdersCountForDateAsync(DateTime date, CancellationToken cancellationToken = default)
    {
        var start = date.Date;
        var end = start.AddDays(1);

        return _context.Orders.CountAsync(
            o => o.OrderDate >= start && o.OrderDate < end,
            cancellationToken);
    }

    public async Task<decimal> GetTotalRevenueAsync(CancellationToken cancellationToken = default)
    {
        var total = await _context.Orders
            .Where(o => o.Status == "Completed")
            .SumAsync(o => (decimal?)o.Total, cancellationToken);

        return total ?? 0m;
    }

    public async Task<IReadOnlyList<Core.Entities.Order>> GetOrdersSinceAsync(DateTime since, CancellationToken cancellationToken = default)
    {
        return await _context.Orders
            .AsNoTracking()
            .Where(o => o.OrderDate >= since)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Core.Entities.OrderItem>> GetOrderItemsSinceAsync(DateTime since, CancellationToken cancellationToken = default)
    {
        return await _context.OrderItems
            .AsNoTracking()
            .Include(i => i.Order)
            .Include(i => i.Product)
            .ThenInclude(p => p.Category)
            .Where(i => i.Order.OrderDate >= since)
            .ToListAsync(cancellationToken);
    }
}
