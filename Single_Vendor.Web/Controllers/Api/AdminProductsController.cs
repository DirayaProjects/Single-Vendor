using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Single_Vendor.Core.Entities;
using Single_Vendor.Infrastructure.Data;
using Single_Vendor.Web.Models.Api;
using Single_Vendor.Web.Services;

namespace Single_Vendor.Web.Controllers.Api;

[ApiController]
[Route("api/admin/products")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
public class AdminProductsController : ControllerBase
{
    private readonly SingleVendorDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly IAdminStoreAccessor _adminStore;
    private readonly ResponsiveImageService _images;

    public AdminProductsController(
        SingleVendorDbContext db,
        IWebHostEnvironment env,
        IAdminStoreAccessor adminStore,
        ResponsiveImageService images)
    {
        _db = db;
        _env = env;
        _adminStore = adminStore;
        _images = images;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductAdminResponse>>> List(
        [FromQuery] string? q,
        [FromQuery] int? categoryId,
        CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("No store linked to this admin account.", statusCode: 403);

        var query = _db.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.ProductImages)
            .Include(p => p.ProductSpecifications)
            .Where(p => p.StoreId == storeId.Value);

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
            .ToListAsync(cancellationToken);
        return Ok(entities.Select(Map).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductAdminResponse>> Get(int id, CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("No store linked to this admin account.", statusCode: 403);

        var p = await _db.Products
            .AsNoTracking()
            .Include(x => x.Category)
            .Include(x => x.ProductImages)
            .Include(x => x.ProductSpecifications)
            .FirstOrDefaultAsync(x => x.ProductId == id && x.StoreId == storeId.Value, cancellationToken);
        if (p is null)
            return NotFound();
        return Ok(Map(p));
    }

    [HttpPost]
    public async Task<ActionResult<ProductAdminResponse>> Create(
        [FromBody] ProductCreateRequest body,
        CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("No store linked to this admin account.", statusCode: 403);

        if (string.IsNullOrWhiteSpace(body.Name))
            return BadRequest("Name is required.");
        if (body.CategoryId.HasValue &&
            !await _db.Categories.AnyAsync(c => c.CategoryId == body.CategoryId && c.StoreId == storeId.Value, cancellationToken))
            return BadRequest("Invalid category.");

        var entity = new Product
        {
            StoreId = storeId.Value,
            CategoryId = body.CategoryId,
            Name = body.Name.Trim(),
            Description = TruncateNullable(body.Description, 8000),
            Brand = TruncateNullable(body.Brand, 200),
            Price = body.Price,
            StockQuantity = body.StockQuantity,
            RatingAverage = 0,
            RatingCount = 0,
            FavoriteCount = 0,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };
        _db.Products.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        ReplaceImages(entity.ProductId, body.ImageUrls);
        ReplaceSpecifications(entity.ProductId, body.Specifications);
        await _db.SaveChangesAsync(cancellationToken);

        var created = await LoadProductTracked(entity.ProductId, cancellationToken);
        return Created($"/api/admin/products/{entity.ProductId}", Map(created!));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProductAdminResponse>> Update(
        int id,
        [FromBody] ProductUpdateRequest body,
        CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("No store linked to this admin account.", statusCode: 403);

        if (string.IsNullOrWhiteSpace(body.Name))
            return BadRequest("Name is required.");
        if (body.CategoryId.HasValue &&
            !await _db.Categories.AnyAsync(c => c.CategoryId == body.CategoryId && c.StoreId == storeId.Value, cancellationToken))
            return BadRequest("Invalid category.");

        var entity = await _db.Products.FirstOrDefaultAsync(p => p.ProductId == id && p.StoreId == storeId.Value, cancellationToken);
        if (entity is null)
            return NotFound();

        entity.CategoryId = body.CategoryId;
        entity.Name = body.Name.Trim();
        entity.Description = TruncateNullable(body.Description, 8000);
        entity.Brand = TruncateNullable(body.Brand, 200);
        entity.Price = body.Price;
        entity.StockQuantity = body.StockQuantity;
        entity.IsActive = body.IsActive;
        entity.UpdatedAtUtc = DateTime.UtcNow;

        ReplaceImages(id, body.ImageUrls);
        ReplaceSpecifications(id, body.Specifications);
        await _db.SaveChangesAsync(cancellationToken);

        var updated = await LoadProductNoTrack(id, cancellationToken);
        return Ok(Map(updated!));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> SoftDelete(int id, CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("No store linked to this admin account.", statusCode: 403);

        var entity = await _db.Products.FirstOrDefaultAsync(p => p.ProductId == id && p.StoreId == storeId.Value, cancellationToken);
        if (entity is null)
            return NotFound();
        entity.IsActive = false;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("upload-image")]
    public async Task<IActionResult> UploadImage(IFormFile? file, CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("No store linked to this admin account.", statusCode: 403);

        if (file == null || file.Length == 0)
            return BadRequest("File required.");

        var url = await _images.SaveWebpVariantsAsync(
            file,
            _env.WebRootPath,
            $"uploads/products/{storeId.Value}",
            Guid.NewGuid().ToString("N"),
            Request.PathBase,
            cancellationToken);
        return Ok(new { url });
    }

    private async Task<int?> ResolveStoreIdAsync(CancellationToken cancellationToken)
    {
        var uid = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue("sub");
        return await _adminStore.GetOwnedStoreIdAsync(uid, cancellationToken);
    }

    private async Task<Product?> LoadProductTracked(int id, CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null) return null;
        return await _db.Products
            .Include(p => p.Category)
            .Include(p => p.ProductImages)
            .Include(p => p.ProductSpecifications)
            .FirstOrDefaultAsync(p => p.ProductId == id && p.StoreId == storeId.Value, cancellationToken);
    }

    private async Task<Product?> LoadProductNoTrack(int id, CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null) return null;
        return await _db.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.ProductImages)
            .Include(p => p.ProductSpecifications)
            .FirstOrDefaultAsync(p => p.ProductId == id && p.StoreId == storeId.Value, cancellationToken);
    }

    private void ReplaceImages(int productId, IReadOnlyList<string>? urls)
    {
        var existing = _db.ProductImages.Where(i => i.ProductId == productId);
        _db.ProductImages.RemoveRange(existing);
        if (urls is null)
            return;
        var sort = 0;
        foreach (var url in urls.Take(20))
        {
            if (string.IsNullOrWhiteSpace(url))
                continue;
            var u = url.Trim();
            if (u.Length > 1000)
                u = u[..1000];
            _db.ProductImages.Add(new ProductImage
            {
                ProductId = productId,
                ImageUrl = u,
                SortOrder = sort,
                IsPrimary = sort == 0
            });
            sort++;
        }
    }

    private void ReplaceSpecifications(int productId, IReadOnlyDictionary<string, string>? specs)
    {
        var existing = _db.ProductSpecifications.Where(s => s.ProductId == productId);
        _db.ProductSpecifications.RemoveRange(existing);
        if (specs is null)
            return;
        foreach (var kv in specs)
        {
            if (string.IsNullOrWhiteSpace(kv.Key))
                continue;
            var key = kv.Key.Trim();
            if (key.Length > 200)
                key = key[..200];
            var val = kv.Value?.Trim() ?? "";
            if (val.Length > 1000)
                val = val[..1000];
            _db.ProductSpecifications.Add(new ProductSpecification
            {
                ProductId = productId,
                SpecKey = key,
                SpecValue = val
            });
        }
    }

    private static ProductAdminResponse Map(Product p) =>
        new()
        {
            ProductId = p.ProductId,
            CategoryId = p.CategoryId,
            CategoryName = p.Category?.Name,
            Name = p.Name,
            Description = p.Description,
            Brand = p.Brand,
            Price = p.Price,
            StockQuantity = p.StockQuantity,
            RatingAverage = p.RatingAverage,
            RatingCount = p.RatingCount,
            FavoriteCount = p.FavoriteCount,
            IsActive = p.IsActive,
            ImageUrls = p.ProductImages
                .OrderBy(i => i.SortOrder)
                .ThenBy(i => i.ProductImageId)
                .Select(i => i.ImageUrl)
                .ToList(),
            Specifications = p.ProductSpecifications.ToDictionary(s => s.SpecKey, s => s.SpecValue)
        };

    private static string? TruncateNullable(string? value, int max)
    {
        if (string.IsNullOrEmpty(value))
            return value;
        return value.Length <= max ? value : value[..max];
    }
}
