using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Single_Vendor.Core.Entities;
using Single_Vendor.Infrastructure.Data;
using Single_Vendor.Web.Helpers;

namespace Single_Vendor.Web.Controllers.Api;

/// <summary>Anonymous product catalog for a storefront (by store slug).</summary>
[ApiController]
[Route("api/storefront/products")]
public class StorefrontProductsController : ControllerBase
{
    private readonly SingleVendorDbContext _db;

    public StorefrontProductsController(SingleVendorDbContext db) => _db = db;

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? storeSlug,
        [FromQuery] int? categoryId,
        [FromQuery] string? q,
        CancellationToken cancellationToken)
    {
        var slug = StoreSlugHelper.NormalizeOrNull(storeSlug);
        if (string.IsNullOrEmpty(slug))
            return Ok(Array.Empty<object>());

        var store = await _db.Stores.AsNoTracking()
            .FirstOrDefaultAsync(s => s.PublicSlug == slug && s.IsActive, cancellationToken);
        if (store is null)
            return Ok(Array.Empty<object>());

        var flags = await _db.StoreFeatureFlags.AsNoTracking()
            .FirstOrDefaultAsync(f => f.StoreId == store.StoreId, cancellationToken);
        var showRatings = StoreFeaturePolicies.RatingStarsEnabled(flags);

        var query = _db.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.ProductImages)
            .Where(p => p.IsActive && p.StoreId == store.StoreId);

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(p =>
                p.Name.Contains(term) ||
                (p.Description != null && p.Description.Contains(term)) ||
                (p.Brand != null && p.Brand.Contains(term)));
        }

        var entities = await query
            .OrderByDescending(p => p.CreatedAtUtc)
            .Take(500)
            .ToListAsync(cancellationToken);

        var list = entities.Select(p => MapProductListItem(p, showRatings)).ToList();

        return Ok(list);
    }

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id, [FromQuery] string? storeSlug, CancellationToken cancellationToken)
    {
        var slug = StoreSlugHelper.NormalizeOrNull(storeSlug);
        if (string.IsNullOrEmpty(slug))
            return NotFound();

        var store = await _db.Stores.AsNoTracking()
            .FirstOrDefaultAsync(s => s.PublicSlug == slug && s.IsActive, cancellationToken);
        if (store is null)
            return NotFound();

        var flags = await _db.StoreFeatureFlags.AsNoTracking()
            .FirstOrDefaultAsync(f => f.StoreId == store.StoreId, cancellationToken);
        var showRatings = StoreFeaturePolicies.RatingStarsEnabled(flags);

        var p = await _db.Products
            .AsNoTracking()
            .Include(x => x.Category)
            .Include(x => x.ProductImages)
            .Include(x => x.ProductSpecifications)
            .FirstOrDefaultAsync(x => x.ProductId == id && x.StoreId == store.StoreId && x.IsActive, cancellationToken);
        if (p is null)
            return NotFound();

        return Ok(new
        {
            p.ProductId,
            p.CategoryId,
            categoryName = p.Category?.Name,
            p.Name,
            p.Description,
            p.Brand,
            p.Price,
            p.StockQuantity,
            ratingAverage = showRatings ? p.RatingAverage : 0m,
            ratingCount = showRatings ? p.RatingCount : 0,
            p.CreatedAtUtc,
            imageUrls = p.ProductImages
                .OrderBy(i => i.SortOrder)
                .ThenBy(i => i.ProductImageId)
                .Select(i => i.ImageUrl)
                .ToList(),
            specifications = p.ProductSpecifications.ToDictionary(s => s.SpecKey, s => s.SpecValue)
        });
    }

    private static object MapProductListItem(Product p, bool showRatings) => new
    {
        p.ProductId,
        p.CategoryId,
        categoryName = p.Category?.Name,
        p.Name,
        p.Description,
        p.Brand,
        p.Price,
        p.StockQuantity,
        ratingAverage = showRatings ? p.RatingAverage : 0m,
        ratingCount = showRatings ? p.RatingCount : 0,
        p.CreatedAtUtc,
        imageUrls = p.ProductImages
            .OrderBy(i => i.SortOrder)
            .ThenBy(i => i.ProductImageId)
            .Select(i => i.ImageUrl)
            .Take(5)
            .ToList()
    };
}
