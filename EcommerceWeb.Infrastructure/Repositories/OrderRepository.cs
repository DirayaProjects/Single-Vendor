using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;
using EcommerceWeb.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EcommerceWeb.Infrastructure.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly EcommerceWebDbContext _context;

    public OrderRepository(EcommerceWebDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<Order>> GetAllWithUserAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Orders
            .AsNoTracking()
            .Include(o => o.User)
            .ThenInclude(u => u.UserProfile)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync(cancellationToken);
    }

    public Task<Order?> GetByIdWithUserAsync(int id, CancellationToken cancellationToken = default)
    {
        return _context.Orders
            .Include(o => o.User)
            .ThenInclude(u => u.UserProfile)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);
    }

    public async Task<string?> FindUserIdByCustomerNameAsync(string customer, CancellationToken cancellationToken = default)
    {
        var user = await _context.AspNetUsers
            .Include(u => u.UserProfile)
            .FirstOrDefaultAsync(
                u => u.UserName == customer
                    || u.Email == customer
                    || (u.UserProfile != null && u.UserProfile.FullName == customer),
                cancellationToken);

        return user?.Id;
    }

    public async Task<Order> CreateAsync(Order order, CancellationToken cancellationToken = default)
    {
        _context.Orders.Add(order);
        await _context.SaveChangesAsync(cancellationToken);
        return order;
    }

    public async Task UpdateAsync(Order order, CancellationToken cancellationToken = default)
    {
        _context.Orders.Update(order);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);

        if (order is null)
        {
            return;
        }

        if (order.OrderItems.Count > 0)
        {
            _context.OrderItems.RemoveRange(order.OrderItems);
        }

        _context.Orders.Remove(order);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
