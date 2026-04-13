using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Single_Vendor.Core.Entities;
using Single_Vendor.Infrastructure.Data;
using Single_Vendor.Web.Helpers;

namespace Single_Vendor.Web.Controllers.Api;

[ApiController]
[Route("api/storefront/wishlist")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Customer")]
public class StorefrontWishlistController : ControllerBase
{
    private readonly SingleVendorDbContext _db;

    public StorefrontWishlistController(SingleVendorDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var uid = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue("sub");
        if (string.IsNullOrEmpty(uid))
            return Unauthorized();

        var storeId = await _db.AspNetUsers.AsNoTracking()
            .Where(u => u.Id == uid)
            .Select(u => u.StoreId)
            .FirstOrDefaultAsync(cancellationToken);
        if (storeId is null)
            return Ok(Array.Empty<int>());

        var flags = await _db.StoreFeatureFlags.AsNoTracking()
            .FirstOrDefaultAsync(f => f.StoreId == storeId.Value, cancellationToken);
        if (!StoreFeaturePolicies.WishlistEnabled(flags))
            return Ok(Array.Empty<int>());

        var rawIds = await _db.WishlistItems.AsNoTracking()
            .Where(w => w.UserId == uid)
            .Select(w => w.ProductId)
            .ToListAsync(cancellationToken);

        if (rawIds.Count == 0)
            return Ok(Array.Empty<int>());

        var valid = await _db.Products.AsNoTracking()
            .Where(p => rawIds.Contains(p.ProductId) && p.StoreId == storeId.Value && p.IsActive)
            .Select(p => p.ProductId)
            .ToListAsync(cancellationToken);

        return Ok(valid);
    }

    public sealed class WishlistMutationRequest
    {
        public int ProductId { get; set; }
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] WishlistMutationRequest body, CancellationToken cancellationToken)
    {
        var uid = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue("sub");
        if (string.IsNullOrEmpty(uid))
            return Unauthorized();

        var storeId = await _db.AspNetUsers.AsNoTracking()
            .Where(u => u.Id == uid)
            .Select(u => u.StoreId)
            .FirstOrDefaultAsync(cancellationToken);
        if (storeId is null)
            return Problem("Your account is not linked to a store.", statusCode: 403);

        var flags = await _db.StoreFeatureFlags.AsNoTracking()
            .FirstOrDefaultAsync(f => f.StoreId == storeId.Value, cancellationToken);
        if (!StoreFeaturePolicies.WishlistEnabled(flags))
            return Problem("Wishlist is disabled for this store.", statusCode: 403);

        var productId = body.ProductId;
        if (productId <= 0)
            return BadRequest("Invalid product.");

        var product = await _db.Products.AsNoTracking()
            .FirstOrDefaultAsync(p => p.ProductId == productId && p.StoreId == storeId.Value && p.IsActive, cancellationToken);
        if (product is null)
            return NotFound();

        var exists = await _db.WishlistItems.AnyAsync(w => w.UserId == uid && w.ProductId == productId, cancellationToken);
        if (!exists)
        {
            _db.WishlistItems.Add(new WishlistItem
            {
                UserId = uid,
                ProductId = productId,
                CreatedAtUtc = DateTime.UtcNow
            });
            await _db.SaveChangesAsync(cancellationToken);
        }

        return Ok(new { ok = true, productId });
    }

    [HttpDelete("{productId:int}")]
    public async Task<IActionResult> Remove(int productId, CancellationToken cancellationToken)
    {
        var uid = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue("sub");
        if (string.IsNullOrEmpty(uid))
            return Unauthorized();

        var row = await _db.WishlistItems.FirstOrDefaultAsync(w => w.UserId == uid && w.ProductId == productId, cancellationToken);
        if (row is null)
            return Ok(new { ok = true });

        _db.WishlistItems.Remove(row);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { ok = true });
    }
}
