using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Single_Vendor.Infrastructure.Data;
using Single_Vendor.Web.Helpers;
using Single_Vendor.Web.Services;

namespace Single_Vendor.Web.Controllers.Api;

[ApiController]
[Route("api/admin/dashboard")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
public class AdminDashboardController : ControllerBase
{
    private readonly SingleVendorDbContext _db;
    private readonly IAdminStoreAccessor _adminStore;

    public AdminDashboardController(SingleVendorDbContext db, IAdminStoreAccessor adminStore)
    {
        _db = db;
        _adminStore = adminStore;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats(CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("No store linked to this admin account.", statusCode: 403);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var userCount = await _db.AspNetUsers.AsNoTracking()
            .CountAsync(u => u.StoreId == storeId.Value, cancellationToken);
        var productCount = await _db.Products.AsNoTracking()
            .CountAsync(p => p.StoreId == storeId.Value, cancellationToken);

        var flags = await _db.StoreFeatureFlags.AsNoTracking()
            .FirstOrDefaultAsync(f => f.StoreId == storeId.Value, cancellationToken);
        if (!StoreFeaturePolicies.AdminSalesAnalyticsEnabled(flags))
        {
            return Ok(new
            {
                userCount,
                productCount,
                ordersToday = 0,
                revenueToday = 0m
            });
        }

        var ordersToday = await _db.Orders.AsNoTracking()
            .CountAsync(o => o.StoreId == storeId.Value && o.OrderDate == today, cancellationToken);
        var revenueToday = await _db.Orders.AsNoTracking()
            .Where(o => o.StoreId == storeId.Value && o.OrderDate == today)
            .SumAsync(o => (decimal?)o.Total, cancellationToken) ?? 0m;

        return Ok(new
        {
            userCount,
            productCount,
            ordersToday,
            revenueToday
        });
    }

    /// <summary>Aggregates for dashboard charts (last 14 days + order mix).</summary>
    [HttpGet("charts")]
    public async Task<IActionResult> Charts(CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("No store linked to this admin account.", statusCode: 403);

        var flags = await _db.StoreFeatureFlags.AsNoTracking()
            .FirstOrDefaultAsync(f => f.StoreId == storeId.Value, cancellationToken);
        if (!StoreFeaturePolicies.AdminSalesAnalyticsEnabled(flags))
        {
            return Ok(new
            {
                revenueByDay = Array.Empty<object>(),
                ordersByStatus = Array.Empty<object>(),
                topProducts = Array.Empty<object>()
            });
        }

        var end = DateOnly.FromDateTime(DateTime.UtcNow);
        var start = end.AddDays(-13);

        var dayStats = await _db.Orders.AsNoTracking()
            .Where(o => o.StoreId == storeId.Value && o.OrderDate >= start && o.OrderDate <= end)
            .GroupBy(o => o.OrderDate)
            .Select(g => new { Date = g.Key, Revenue = g.Sum(x => x.Total), Orders = g.Count() })
            .ToListAsync(cancellationToken);

        var dayDict = dayStats.ToDictionary(x => x.Date, x => x);
        var revenueByDay = new List<object>();
        for (var d = start; d <= end; d = d.AddDays(1))
        {
            if (!dayDict.TryGetValue(d, out var row))
            {
                revenueByDay.Add(new
                {
                    date = d.ToString("yyyy-MM-dd"),
                    revenue = 0m,
                    orders = 0,
                    avgOrder = 0m
                });
            }
            else
            {
                var avg = row.Orders == 0 ? 0m : row.Revenue / row.Orders;
                revenueByDay.Add(new
                {
                    date = d.ToString("yyyy-MM-dd"),
                    revenue = row.Revenue,
                    orders = row.Orders,
                    avgOrder = avg
                });
            }
        }

        var ordersByStatus = await _db.Orders.AsNoTracking()
            .Where(o => o.StoreId == storeId.Value)
            .GroupBy(o => o.Status)
            .Select(g => new { name = g.Key, value = g.Count() })
            .ToListAsync(cancellationToken);

        var topProducts = await _db.OrderItems.AsNoTracking()
            .Where(oi => oi.Order.StoreId == storeId.Value)
            .GroupBy(oi => oi.ProductName)
            .Select(g => new { name = g.Key, quantitySold = g.Sum(x => x.Quantity) })
            .OrderByDescending(x => x.quantitySold)
            .Take(8)
            .ToListAsync(cancellationToken);

        return Ok(new { revenueByDay, ordersByStatus, topProducts });
    }

    private async Task<int?> ResolveStoreIdAsync(CancellationToken cancellationToken)
    {
        var uid = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue("sub");
        return await _adminStore.GetOwnedStoreIdAsync(uid, cancellationToken);
    }
}
