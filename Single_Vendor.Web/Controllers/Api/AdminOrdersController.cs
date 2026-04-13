using System.Security.Claims;
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
[Route("api/admin/orders")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
public class AdminOrdersController : ControllerBase
{
    private readonly SingleVendorDbContext _db;
    private readonly IAdminStoreAccessor _adminStore;

    public AdminOrdersController(SingleVendorDbContext db, IAdminStoreAccessor adminStore)
    {
        _db = db;
        _adminStore = adminStore;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OrderAdminListResponse>>> List(CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("No store linked to this admin account.", statusCode: 403);

        if (await IsOrdersModuleDisabledAsync(storeId.Value, cancellationToken))
            return Forbid();

        var list = await _db.Orders
            .AsNoTracking()
            .Where(o => o.StoreId == storeId.Value)
            .OrderByDescending(o => o.OrderId)
            .Select(o => new OrderAdminListResponse
            {
                OrderId = o.OrderId,
                CustomerName = o.CustomerName,
                CustomerEmail = o.CustomerEmail,
                SubTotal = o.SubTotal,
                DiscountAmount = o.DiscountAmount,
                DeliveryFee = o.DeliveryFee,
                Total = o.Total,
                Status = o.Status,
                OrderDate = o.OrderDate,
                Notes = o.Notes
            })
            .ToListAsync(cancellationToken);
        return Ok(list);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderAdminListResponse>> Get(int id, CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("No store linked to this admin account.", statusCode: 403);

        if (await IsOrdersModuleDisabledAsync(storeId.Value, cancellationToken))
            return Forbid();

        var o = await _db.Orders
            .AsNoTracking()
            .Where(x => x.OrderId == id && x.StoreId == storeId.Value)
            .Select(x => new OrderAdminListResponse
            {
                OrderId = x.OrderId,
                CustomerName = x.CustomerName,
                CustomerEmail = x.CustomerEmail,
                SubTotal = x.SubTotal,
                DiscountAmount = x.DiscountAmount,
                DeliveryFee = x.DeliveryFee,
                Total = x.Total,
                Status = x.Status,
                OrderDate = x.OrderDate,
                Notes = x.Notes
            })
            .FirstOrDefaultAsync(cancellationToken);
        if (o is null)
            return NotFound();
        return Ok(o);
    }

    [HttpPost]
    public async Task<ActionResult<OrderAdminListResponse>> Create(
        [FromBody] OrderCreateRequest body,
        CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("No store linked to this admin account.", statusCode: 403);

        if (await IsOrdersModuleDisabledAsync(storeId.Value, cancellationToken))
            return Forbid();

        if (string.IsNullOrWhiteSpace(body.CustomerName))
            return BadRequest("Customer name is required.");

        var order = new Order
        {
            StoreId = storeId.Value,
            CustomerName = body.CustomerName.Trim(),
            CustomerEmail = Truncate(body.CustomerEmail, 256),
            Status = string.IsNullOrWhiteSpace(body.Status) ? "Pending" : body.Status.Trim(),
            OrderDate = body.OrderDate == default ? DateOnly.FromDateTime(DateTime.UtcNow) : body.OrderDate,
            Notes = Truncate(body.Notes, 500),
            DiscountAmount = 0,
            DeliveryFee = 0,
            CreatedAtUtc = DateTime.UtcNow
        };

        if (body.Items is { Count: > 0 })
        {
            decimal subTotal = 0;
            foreach (var item in body.Items)
            {
                if (item.Quantity <= 0)
                    return BadRequest("Each line item needs quantity > 0.");
                var prod = await _db.Products.AsNoTracking()
                    .FirstOrDefaultAsync(p => p.ProductId == item.ProductId && p.StoreId == storeId.Value, cancellationToken);
                if (prod is null)
                    return BadRequest($"Unknown product id {item.ProductId}.");
                var lineTotal = prod.Price * item.Quantity;
                subTotal += lineTotal;
                order.OrderItems.Add(new OrderItem
                {
                    ProductId = prod.ProductId,
                    ProductName = prod.Name,
                    Quantity = item.Quantity,
                    UnitPrice = prod.Price
                });
            }

            order.SubTotal = subTotal;
            order.Total = subTotal - order.DiscountAmount + order.DeliveryFee;
        }
        else
        {
            order.SubTotal = 0;
            order.Total = 0;
        }

        _db.Orders.Add(order);
        await _db.SaveChangesAsync(cancellationToken);

        return Created($"/api/admin/orders/{order.OrderId}", new OrderAdminListResponse
        {
            OrderId = order.OrderId,
            CustomerName = order.CustomerName,
            CustomerEmail = order.CustomerEmail,
            SubTotal = order.SubTotal,
            DiscountAmount = order.DiscountAmount,
            DeliveryFee = order.DeliveryFee,
            Total = order.Total,
            Status = order.Status,
            OrderDate = order.OrderDate,
            Notes = order.Notes
        });
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<OrderAdminListResponse>> Update(
        int id,
        [FromBody] OrderUpdateRequest body,
        CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("No store linked to this admin account.", statusCode: 403);

        if (await IsOrdersModuleDisabledAsync(storeId.Value, cancellationToken))
            return Forbid();

        if (string.IsNullOrWhiteSpace(body.CustomerName))
            return BadRequest("Customer name is required.");

        var order = await _db.Orders.FirstOrDefaultAsync(o => o.OrderId == id && o.StoreId == storeId.Value, cancellationToken);
        if (order is null)
            return NotFound();

        order.CustomerName = body.CustomerName.Trim();
        order.CustomerEmail = Truncate(body.CustomerEmail, 256);
        order.Status = string.IsNullOrWhiteSpace(body.Status) ? order.Status : body.Status.Trim();
        order.OrderDate = body.OrderDate;
        order.Notes = Truncate(body.Notes, 500);
        order.SubTotal = body.SubTotal;
        order.DiscountAmount = body.DiscountAmount;
        order.DeliveryFee = body.DeliveryFee;
        order.Total = body.Total;

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new OrderAdminListResponse
        {
            OrderId = order.OrderId,
            CustomerName = order.CustomerName,
            CustomerEmail = order.CustomerEmail,
            SubTotal = order.SubTotal,
            DiscountAmount = order.DiscountAmount,
            DeliveryFee = order.DeliveryFee,
            Total = order.Total,
            Status = order.Status,
            OrderDate = order.OrderDate,
            Notes = order.Notes
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var storeId = await ResolveStoreIdAsync(cancellationToken);
        if (storeId is null)
            return Problem("No store linked to this admin account.", statusCode: 403);

        if (await IsOrdersModuleDisabledAsync(storeId.Value, cancellationToken))
            return Forbid();

        var order = await _db.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.OrderId == id && o.StoreId == storeId.Value, cancellationToken);
        if (order is null)
            return NotFound();
        _db.OrderItems.RemoveRange(order.OrderItems);
        _db.Orders.Remove(order);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<bool> IsOrdersModuleDisabledAsync(int storeId, CancellationToken cancellationToken)
    {
        var f = await _db.StoreFeatureFlags.AsNoTracking()
            .FirstOrDefaultAsync(x => x.StoreId == storeId, cancellationToken);
        return !StoreFeaturePolicies.AdminOrdersEnabled(f);
    }

    private async Task<int?> ResolveStoreIdAsync(CancellationToken cancellationToken)
    {
        var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return await _adminStore.GetOwnedStoreIdAsync(uid, cancellationToken);
    }

    private static string? Truncate(string? value, int max)
    {
        if (string.IsNullOrEmpty(value))
            return value;
        return value.Length <= max ? value : value[..max];
    }
}
