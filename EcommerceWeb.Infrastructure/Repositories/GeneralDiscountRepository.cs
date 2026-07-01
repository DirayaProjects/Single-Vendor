using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;
using EcommerceWeb.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EcommerceWeb.Infrastructure.Repositories;

public class GeneralDiscountRepository : IGeneralDiscountRepository
{
    private readonly EcommerceWebDbContext _context;

    public GeneralDiscountRepository(EcommerceWebDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<GeneralDiscount>> GetAllWithProductsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.GeneralDiscounts
            .AsNoTracking()
            .Include(d => d.Products)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<GeneralDiscount>> GetActiveWithProductsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        return await _context.GeneralDiscounts
            .AsNoTracking()
            .Include(d => d.Products)
            .Where(d => d.IsActive
                && (!d.StartDate.HasValue || d.StartDate <= now)
                && (!d.EndDate.HasValue || d.EndDate >= now))
            .ToListAsync(cancellationToken);
    }

    public Task<GeneralDiscount?> GetByIdWithProductsAsync(int id, CancellationToken cancellationToken = default)
    {
        return _context.GeneralDiscounts
            .Include(d => d.Products)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);
    }

    public async Task<GeneralDiscount> CreateAsync(
        GeneralDiscount discount,
        IEnumerable<int> productIds,
        CancellationToken cancellationToken = default)
    {
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync(cancellationToken);

        discount.Products = products;
        _context.GeneralDiscounts.Add(discount);
        await _context.SaveChangesAsync(cancellationToken);
        return discount;
    }

    public async Task UpdateAsync(
        GeneralDiscount discount,
        IEnumerable<int> productIds,
        CancellationToken cancellationToken = default)
    {
        var existing = await _context.GeneralDiscounts
            .Include(d => d.Products)
            .FirstOrDefaultAsync(d => d.Id == discount.Id, cancellationToken);

        if (existing is null)
        {
            throw new InvalidOperationException("Discount not found.");
        }

        existing.Name = discount.Name;
        existing.DiscountPercent = discount.DiscountPercent;
        existing.DiscountAmount = discount.DiscountAmount;
        existing.IsActive = discount.IsActive;
        existing.StartDate = discount.StartDate;
        existing.EndDate = discount.EndDate;
        existing.UpdatedAt = discount.UpdatedAt;

        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync(cancellationToken);

        existing.Products.Clear();
        foreach (var product in products)
        {
            existing.Products.Add(product);
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var discount = await _context.GeneralDiscounts
            .Include(d => d.Products)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

        if (discount is null) return;

        discount.Products.Clear();
        _context.GeneralDiscounts.Remove(discount);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
