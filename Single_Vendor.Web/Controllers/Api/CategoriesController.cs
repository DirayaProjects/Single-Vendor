using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Single_Vendor.Infrastructure.Data;
using Single_Vendor.Web.Helpers;

namespace Single_Vendor.Web.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly SingleVendorDbContext _db;

    public CategoriesController(SingleVendorDbContext db) => _db = db;

    /// <param name="storeSlug">Public store slug (required).</param>
    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? storeSlug, CancellationToken cancellationToken)
    {
        var slug = StoreSlugHelper.NormalizeOrNull(storeSlug);
        if (string.IsNullOrEmpty(slug))
            return Ok(Array.Empty<object>());

        var store = await _db.Stores.AsNoTracking()
            .FirstOrDefaultAsync(s => s.PublicSlug == slug && s.IsActive, cancellationToken);
        if (store is null)
            return Ok(Array.Empty<object>());

        var items = await _db.Categories
            .AsNoTracking()
            .Where(c => c.IsActive && c.StoreId == store.StoreId)
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .Select(c => new { c.CategoryId, c.Name, c.ImageUrl, c.Slug })
            .ToListAsync(cancellationToken);
        return Ok(items);
    }
}
