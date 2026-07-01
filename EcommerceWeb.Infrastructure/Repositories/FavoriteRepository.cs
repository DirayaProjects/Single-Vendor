using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;
using EcommerceWeb.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EcommerceWeb.Infrastructure.Repositories;

public class FavoriteRepository : IFavoriteRepository
{
    private readonly EcommerceWebDbContext _context;

    public FavoriteRepository(EcommerceWebDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<Favorite>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _context.Favorites
            .AsNoTracking()
            .Include(f => f.Product)
            .ThenInclude(p => p.ProductImages)
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public Task<bool> ExistsAsync(string userId, int productId, CancellationToken cancellationToken = default)
    {
        return _context.Favorites.AnyAsync(f => f.UserId == userId && f.ProductId == productId, cancellationToken);
    }

    public async Task AddAsync(string userId, int productId, CancellationToken cancellationToken = default)
    {
        if (await ExistsAsync(userId, productId, cancellationToken))
        {
            return;
        }

        _context.Favorites.Add(new Favorite
        {
            UserId = userId,
            ProductId = productId,
            CreatedAt = DateTime.UtcNow
        });

        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == productId, cancellationToken);
        if (product is not null)
        {
            product.FavoriteCount += 1;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveAsync(string userId, int productId, CancellationToken cancellationToken = default)
    {
        var favorite = await _context.Favorites
            .FirstOrDefaultAsync(f => f.UserId == userId && f.ProductId == productId, cancellationToken);

        if (favorite is null)
        {
            return;
        }

        _context.Favorites.Remove(favorite);

        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == productId, cancellationToken);
        if (product is not null && product.FavoriteCount > 0)
        {
            product.FavoriteCount -= 1;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
