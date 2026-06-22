using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Single_Vendor.Core.Entities;
using Single_Vendor.Infrastructure.Data;
using Single_Vendor.Web.Helpers;
using Single_Vendor.Web.Models.Api;

namespace Single_Vendor.Web.Controllers.Api;

[ApiController]
[Route("api/storefront/checkout")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Customer")]
public class StorefrontCheckoutController : ControllerBase
{
    private readonly SingleVendorDbContext _db;

    public StorefrontCheckoutController(SingleVendorDbContext db) => _db = db;

    [HttpPost]
    public async Task<ActionResult<CheckoutResponse>> Post([FromBody] CheckoutRequest body, CancellationToken cancellationToken)
    {
        var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(uid))
            return Unauthorized();

        if (body.Items is not { Count: > 0 })
            return BadRequest("Cart is empty.");

        var storeId = await _db.AspNetUsers.AsNoTracking()
            .Where(u => u.Id == uid)
            .Select(u => u.StoreId)
            .FirstOrDefaultAsync(cancellationToken);
        if (storeId is null)
            return Problem("Your account is not linked to a store.", statusCode: 403);

        var flags = await _db.StoreFeatureFlags.AsNoTracking()
            .FirstOrDefaultAsync(f => f.StoreId == storeId.Value, cancellationToken);
        if (!StoreFeaturePolicies.CartCheckoutEnabled(flags))
            return Problem("Checkout is disabled for this store.", statusCode: 403);

        var email = User.FindFirstValue(ClaimTypes.Email);
        var customerName = string.IsNullOrWhiteSpace(email) ? "Customer" : email.Trim();

        var order = new Order
        {
            StoreId = storeId.Value,
            UserId = uid,
            CustomerName = customerName.Length > 200 ? customerName[..200] : customerName,
            CustomerEmail = string.IsNullOrWhiteSpace(email) ? null : (email.Length > 256 ? email[..256] : email),
            Status = "Pending",
            OrderDate = DateOnly.FromDateTime(DateTime.UtcNow),
            Notes = string.IsNullOrWhiteSpace(body.Notes) ? null : (body.Notes.Length > 500 ? body.Notes[..500] : body.Notes.Trim()),
            DiscountAmount = 0,
            DeliveryFee = 10,
            CreatedAtUtc = DateTime.UtcNow
        };

        decimal subTotal = 0;
        foreach (var line in body.Items)
        {
            if (line.Quantity <= 0)
                return BadRequest("Each item needs quantity > 0.");

            var prod = await _db.Products.FirstOrDefaultAsync(
                p => p.ProductId == line.ProductId && p.StoreId == storeId.Value && p.IsActive,
                cancellationToken);
            if (prod is null)
                return BadRequest($"Unknown or unavailable product {line.ProductId}.");

            if (prod.StockQuantity < line.Quantity)
                return BadRequest($"Not enough stock for \"{prod.Name}\".");

            var lineTotal = prod.Price * line.Quantity;
            subTotal += lineTotal;

            order.OrderItems.Add(new OrderItem
            {
                ProductId = prod.ProductId,
                ProductName = prod.Name,
                Quantity = line.Quantity,
                UnitPrice = prod.Price
            });

            prod.StockQuantity -= line.Quantity;
            prod.UpdatedAtUtc = DateTime.UtcNow;
        }

        order.SubTotal = subTotal;
        order.Total = subTotal - order.DiscountAmount + order.DeliveryFee;

        _db.Orders.Add(order);
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new CheckoutResponse
        {
            OrderId = order.OrderId,
            Total = order.Total,
            Status = order.Status
        });
    }
}
