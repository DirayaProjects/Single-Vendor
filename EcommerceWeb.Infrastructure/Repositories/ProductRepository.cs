using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;
using EcommerceWeb.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EcommerceWeb.Infrastructure.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly EcommerceWebDbContext _context;

    public ProductRepository(EcommerceWebDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<Product>> GetAllWithDetailsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.ProductImages)
            .Include(p => p.AttributeValues)
            .ThenInclude(v => v.Attribute)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public Task<Product?> GetByIdWithDetailsAsync(int id, CancellationToken cancellationToken = default)
    {
        return _context.Products
            .Include(p => p.Category)
            .Include(p => p.ProductImages)
            .Include(p => p.AttributeValues)
            .ThenInclude(v => v.Attribute)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<Product> CreateAsync(
        Product product,
        IEnumerable<string> imageUrls,
        IEnumerable<int> attributeValueIds,
        CancellationToken cancellationToken = default)
    {
        _context.Products.Add(product);
        await _context.SaveChangesAsync(cancellationToken);

        await ReplaceImagesAsync(product.Id, imageUrls, cancellationToken);
        await ReplaceAttributeValuesAsync(product, attributeValueIds, cancellationToken);

        return product;
    }

    public async Task UpdateAsync(
        Product product,
        IEnumerable<string> imageUrls,
        IEnumerable<int> attributeValueIds,
        CancellationToken cancellationToken = default)
    {
        _context.Products.Update(product);
        await _context.SaveChangesAsync(cancellationToken);

        await ReplaceImagesAsync(product.Id, imageUrls, cancellationToken);
        await ReplaceAttributeValuesAsync(product, attributeValueIds, cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var product = await _context.Products
            .Include(p => p.ProductImages)
            .Include(p => p.AttributeValues)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (product is null)
        {
            return;
        }

        _context.ProductImages.RemoveRange(product.ProductImages);
        product.AttributeValues.Clear();
        _context.Products.Remove(product);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task ReplaceImagesAsync(int productId, IEnumerable<string> imageUrls, CancellationToken cancellationToken)
    {
        var existing = await _context.ProductImages
            .Where(i => i.ProductId == productId)
            .ToListAsync(cancellationToken);

        if (existing.Count > 0)
        {
            _context.ProductImages.RemoveRange(existing);
        }

        var sortOrder = 0;
        foreach (var url in imageUrls)
        {
            _context.ProductImages.Add(new ProductImage
            {
                ProductId = productId,
                ImageUrl = url,
                SortOrder = sortOrder++
            });
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task ReplaceAttributeValuesAsync(Product product, IEnumerable<int> attributeValueIds, CancellationToken cancellationToken)
    {
        var tracked = await _context.Products
            .Include(p => p.AttributeValues)
            .FirstOrDefaultAsync(p => p.Id == product.Id, cancellationToken);

        if (tracked is null)
        {
            return;
        }

        tracked.AttributeValues.Clear();

        var ids = attributeValueIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            await _context.SaveChangesAsync(cancellationToken);
            return;
        }

        var values = await _context.AttributeValues
            .Where(v => ids.Contains(v.Id))
            .ToListAsync(cancellationToken);

        foreach (var value in values)
        {
            tracked.AttributeValues.Add(value);
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
