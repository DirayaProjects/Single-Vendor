using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Single_Vendor.Core.Entities;
using Single_Vendor.Infrastructure.Data;
using Single_Vendor.Web.Helpers;
using Single_Vendor.Web.Models.Api;
using Single_Vendor.Web.Services;

namespace Single_Vendor.Web.Controllers.Api;

[ApiController]
[Route("api/admin/categories")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
public class AdminCategoriesController : ControllerBase
{
    private readonly SingleVendorDbContext _db;
    private readonly IAdminStoreAccessor _adminStore;
    private readonly IWebHostEnvironment _env;
    private readonly ResponsiveImageService _images;

    public AdminCategoriesController(
        SingleVendorDbContext db,
        IAdminStoreAccessor adminStore,
        IWebHostEnvironment env,
        ResponsiveImageService images)
    {
        _db = db;
        _adminStore = adminStore;
        _env = env;
        _images = images;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CategoryAdminResponse>>> List(CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("No store linked to this admin account.", statusCode: 403);

        var items = await _db.Categories
            .AsNoTracking()
            .Where(c => c.StoreId == storeId.Value)
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .Select(c => new CategoryAdminResponse
            {
                CategoryId = c.CategoryId,
                Name = c.Name,
                ImageUrl = c.ImageUrl,
                Slug = c.Slug,
                DisplayOrder = c.DisplayOrder,
                IsActive = c.IsActive
            })
            .ToListAsync(cancellationToken);
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryAdminResponse>> Create([FromBody] CategoryCreateRequest body, CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("No store linked to this admin account.", statusCode: 403);

        if (string.IsNullOrWhiteSpace(body.Name))
            return BadRequest("Name is required.");

        var baseSlug = SlugHelper.Slugify(body.Name);
        var slug = await UniqueSlugAsync(storeId.Value, baseSlug, null, cancellationToken);

        var maxOrder = await _db.Categories.Where(c => c.StoreId == storeId.Value).MaxAsync(c => (int?)c.DisplayOrder, cancellationToken) ?? 0;
        var order = body.DisplayOrder ?? maxOrder + 1;

        var entity = new Category
        {
            StoreId = storeId.Value,
            Name = body.Name.Trim(),
            ImageUrl = TruncateUrl(body.ImageUrl),
            Slug = TruncateSlug(slug),
            DisplayOrder = order,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.Categories.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        var dto = new CategoryAdminResponse
        {
            CategoryId = entity.CategoryId,
            Name = entity.Name,
            ImageUrl = entity.ImageUrl,
            Slug = entity.Slug,
            DisplayOrder = entity.DisplayOrder,
            IsActive = entity.IsActive
        };
        return Created($"/api/admin/categories/{entity.CategoryId}", dto);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CategoryAdminResponse>> Update(int id, [FromBody] CategoryUpdateRequest body, CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("No store linked to this admin account.", statusCode: 403);

        if (string.IsNullOrWhiteSpace(body.Name))
            return BadRequest("Name is required.");

        var entity = await _db.Categories.FirstOrDefaultAsync(c => c.CategoryId == id && c.StoreId == storeId.Value, cancellationToken);
        if (entity is null)
            return NotFound();

        var baseSlug = SlugHelper.Slugify(body.Name);
        var slug = await UniqueSlugAsync(storeId.Value, baseSlug, id, cancellationToken);

        entity.Name = body.Name.Trim();
        entity.ImageUrl = TruncateUrl(body.ImageUrl);
        entity.Slug = TruncateSlug(slug);
        entity.DisplayOrder = body.DisplayOrder;
        entity.IsActive = body.IsActive;
        entity.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new CategoryAdminResponse
        {
            CategoryId = entity.CategoryId,
            Name = entity.Name,
            ImageUrl = entity.ImageUrl,
            Slug = entity.Slug,
            DisplayOrder = entity.DisplayOrder,
            IsActive = entity.IsActive
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> SoftDelete(int id, CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("No store linked to this admin account.", statusCode: 403);

        var entity = await _db.Categories.FirstOrDefaultAsync(c => c.CategoryId == id && c.StoreId == storeId.Value, cancellationToken);
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
        if (file is null || file.Length == 0)
            return BadRequest("File required.");

        var url = await _images.SaveWebpVariantsAsync(
            file,
            _env.WebRootPath,
            $"uploads/categories/{storeId.Value}",
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

    private async Task<string> UniqueSlugAsync(int storeId, string baseSlug, int? excludeCategoryId, CancellationToken cancellationToken)
    {
        var slug = baseSlug;
        var n = 1;
        while (await _db.Categories.AnyAsync(
                   c => c.StoreId == storeId && c.Slug == slug && (!excludeCategoryId.HasValue || c.CategoryId != excludeCategoryId.Value),
                   cancellationToken))
        {
            n++;
            slug = $"{baseSlug}-{n}";
        }

        return slug;
    }

    private static string? TruncateUrl(string? url) =>
        string.IsNullOrEmpty(url) ? url : (url.Length <= 1000 ? url : url[..1000]);

    private static string TruncateSlug(string slug) =>
        slug.Length <= 256 ? slug : slug[..256];
}
