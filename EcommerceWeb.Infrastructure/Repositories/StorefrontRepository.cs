using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;
using EcommerceWeb.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EcommerceWeb.Infrastructure.Repositories;

public class StorefrontRepository : IStorefrontRepository
{
    private readonly EcommerceWebDbContext _context;

    public StorefrontRepository(EcommerceWebDbContext context)
    {
        _context = context;
    }

    public Task<WebsiteSetting?> GetSettingsAsync(CancellationToken cancellationToken = default)
    {
        return _context.WebsiteSettings
            .AsNoTracking()
            .OrderBy(s => s.Id)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Category>> GetActiveCategoriesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Categories
            .AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Product>> GetActiveProductsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Products
            .AsNoTracking()
            .Where(p => p.IsActive)
            .Include(p => p.Category)
            .Include(p => p.ProductImages)
            .Include(p => p.AttributeValues)
            .ThenInclude(v => v.Attribute)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public Task<Product?> GetActiveProductByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return _context.Products
            .AsNoTracking()
            .Where(p => p.IsActive && p.Id == id)
            .Include(p => p.Category)
            .Include(p => p.ProductImages)
            .Include(p => p.AttributeValues)
            .ThenInclude(v => v.Attribute)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Testimonial>> GetActiveTestimonialsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Testimonials
            .AsNoTracking()
            .Where(t => t.IsActive && !t.Comment.StartsWith("[Product:"))
            .OrderBy(t => t.SortOrder)
            .ThenByDescending(t => t.Id)
            .ToListAsync(cancellationToken);
    }
}
