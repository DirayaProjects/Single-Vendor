using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Single_Vendor.Infrastructure.Data;
using Single_Vendor.Web.Services;

namespace Single_Vendor.Web.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly SingleVendorDbContext _db;
    private readonly IAdminStoreAccessor _adminStore;

    public AdminController(SingleVendorDbContext db, IAdminStoreAccessor adminStore)
    {
        _db = db;
        _adminStore = adminStore;
    }

    /// <summary>Smoke test: JWT must include the Admin role.</summary>
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    [HttpGet("ping")]
    public IActionResult Ping() => Ok(new { ok = true, message = "Admin role recognized." });

    /// <summary>Example read using store DbContext (no new entities).</summary>
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    [HttpGet("categories/count")]
    public async Task<IActionResult> CategoryCount(CancellationToken cancellationToken)
    {
        var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var storeId = await _adminStore.GetOwnedStoreIdAsync(uid, cancellationToken);
        if (storeId is null)
            return Problem("No store linked to this admin account.", statusCode: 403);

        var count = await _db.Categories.AsNoTracking().CountAsync(c => c.StoreId == storeId.Value, cancellationToken);
        return Ok(new { count });
    }
}
