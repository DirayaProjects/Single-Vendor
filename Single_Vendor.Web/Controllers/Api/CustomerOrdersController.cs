using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Single_Vendor.Infrastructure.Data;
using Single_Vendor.Web.Models.Api;

namespace Single_Vendor.Web.Controllers.Api;

[ApiController]
[Route("api/me/orders")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Customer")]
public class CustomerOrdersController : ControllerBase
{
    private readonly SingleVendorDbContext _db;

    public CustomerOrdersController(SingleVendorDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CustomerOrderListResponse>>> List(CancellationToken cancellationToken)
    {
        var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(uid))
            return Unauthorized();

        var list = await _db.Orders.AsNoTracking()
            .Where(o => o.UserId == uid)
            .OrderByDescending(o => o.OrderId)
            .Select(o => new CustomerOrderListResponse
            {
                OrderId = o.OrderId,
                Status = o.Status,
                OrderDate = o.OrderDate,
                Total = o.Total,
                LineCount = o.OrderItems.Count
            })
            .ToListAsync(cancellationToken);

        return Ok(list);
    }
}
