using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;
using EcommerceWeb.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EcommerceWeb.Infrastructure.Repositories;

public class ProductReviewRepository : IProductReviewRepository
{
    private readonly EcommerceWebDbContext _context;

    public ProductReviewRepository(EcommerceWebDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<Testimonial>> GetByProductIdAsync(int productId, CancellationToken cancellationToken = default)
    {
        var prefix = $"[Product:{productId}]";
        return await _context.Testimonials
            .AsNoTracking()
            .Where(t => t.IsActive && t.Comment.StartsWith(prefix))
            .OrderByDescending(t => t.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<Testimonial?> GetUserReviewForProductAsync(string userId, int productId, CancellationToken cancellationToken = default)
    {
        var user = await _context.AspNetUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null)
        {
            return null;
        }

        var username = user.UserName ?? user.Email;
        if (string.IsNullOrWhiteSpace(username))
        {
            return null;
        }

        var prefix = $"[Product:{productId}]";
        return await _context.Testimonials
            .FirstOrDefaultAsync(
                t => t.IsActive && t.Comment.StartsWith(prefix) && t.Username == username,
                cancellationToken);
    }

    public async Task<Testimonial> CreateAsync(Testimonial testimonial, CancellationToken cancellationToken = default)
    {
        _context.Testimonials.Add(testimonial);
        await _context.SaveChangesAsync(cancellationToken);
        return testimonial;
    }

    public async Task UpdateAsync(Testimonial testimonial, CancellationToken cancellationToken = default)
    {
        _context.Testimonials.Update(testimonial);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<decimal> GetAverageRatingForProductAsync(int productId, CancellationToken cancellationToken = default)
    {
        var prefix = $"[Product:{productId}]";
        var ratings = await _context.Testimonials
            .AsNoTracking()
            .Where(t => t.IsActive && t.Comment.StartsWith(prefix))
            .Select(t => t.Rating)
            .ToListAsync(cancellationToken);

        return ratings.Count == 0 ? 0 : Math.Round(ratings.Average(), 2);
    }

    public async Task UpdateProductRatingAsync(int productId, decimal rating, CancellationToken cancellationToken = default)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == productId, cancellationToken);
        if (product is null)
        {
            return;
        }

        product.Rating = rating;
        product.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
    }
}
