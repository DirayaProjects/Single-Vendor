using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;
using EcommerceWeb.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EcommerceWeb.Infrastructure.Repositories;

public class CartRepository : ICartRepository
{
    private readonly EcommerceWebDbContext _context;

    public CartRepository(EcommerceWebDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<CartItem>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _context.CartItems
            .AsNoTracking()
            .Include(c => c.Product)
            .ThenInclude(p => p.ProductImages)
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public Task<CartItem?> GetByUserAndProductAsync(string userId, int productId, CancellationToken cancellationToken = default)
    {
        return _context.CartItems
            .FirstOrDefaultAsync(c => c.UserId == userId && c.ProductId == productId, cancellationToken);
    }

    public async Task<CartItem> AddOrUpdateAsync(CartItem item, CancellationToken cancellationToken = default)
    {
        if (item.Id == 0)
        {
            _context.CartItems.Add(item);
        }
        else
        {
            _context.CartItems.Update(item);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return item;
    }

    public async Task UpdateQuantityAsync(int cartItemId, int quantity, CancellationToken cancellationToken = default)
    {
        var item = await _context.CartItems.FirstOrDefaultAsync(c => c.Id == cartItemId, cancellationToken);
        if (item is null)
        {
            return;
        }

        item.Quantity = quantity;
        item.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveAsync(int cartItemId, CancellationToken cancellationToken = default)
    {
        var item = await _context.CartItems.FirstOrDefaultAsync(c => c.Id == cartItemId, cancellationToken);
        if (item is null)
        {
            return;
        }

        _context.CartItems.Remove(item);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task ClearAsync(string userId, CancellationToken cancellationToken = default)
    {
        var items = await _context.CartItems.Where(c => c.UserId == userId).ToListAsync(cancellationToken);
        if (items.Count > 0)
        {
            _context.CartItems.RemoveRange(items);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
