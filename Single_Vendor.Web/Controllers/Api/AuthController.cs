using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Single_Vendor.Infrastructure.Data;
using Single_Vendor.Web.Helpers;
using Single_Vendor.Web.Models.Api;
using Single_Vendor.Web.Services;

namespace Single_Vendor.Web.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    public const string StoreIdClaimType = "store_id";

    private readonly UserManager<IdentityUser> _users;
    private readonly RoleManager<IdentityRole> _roles;
    private readonly SingleVendorDbContext _vendorDb;
    private readonly ICustomerJwtIssuer _jwtIssuer;

    public AuthController(
        UserManager<IdentityUser> users,
        RoleManager<IdentityRole> roles,
        SingleVendorDbContext vendorDb,
        ICustomerJwtIssuer jwtIssuer)
    {
        _users = users;
        _roles = roles;
        _vendorDb = vendorDb;
        _jwtIssuer = jwtIssuer;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest body, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password))
            return BadRequest("Email and password are required.");

        var user = await _users.FindByEmailAsync(body.Email.Trim());
        if (user is null)
            return Unauthorized();

        if (!await _users.CheckPasswordAsync(user, body.Password))
            return Unauthorized();

        var roles = await _users.GetRolesAsync(user);

        if (!string.IsNullOrWhiteSpace(body.StoreSlug))
        {
            var store = await StoreResolutionHelper.ResolveActiveStoreAsync(_vendorDb, body.StoreSlug, cancellationToken);
            if (store is null)
                return BadRequest("Unknown store code or shop name.");

            if (roles.Contains("Customer", StringComparer.OrdinalIgnoreCase))
            {
                var customerStoreId = await _vendorDb.AspNetUsers.AsNoTracking()
                    .Where(u => u.Id == user.Id)
                    .Select(u => u.StoreId)
                    .FirstOrDefaultAsync(cancellationToken);
                if (!customerStoreId.HasValue)
                {
                    await _vendorDb.Database.ExecuteSqlInterpolatedAsync(
                        $"UPDATE AspNetUsers SET StoreId = {store.StoreId} WHERE Id = {user.Id}",
                        cancellationToken);
                    customerStoreId = store.StoreId;
                }
                if (customerStoreId.HasValue && customerStoreId != store.StoreId)
                    return Unauthorized();
            }
        }

        var token = await _jwtIssuer.IssueAsync(user, cancellationToken);
        return Ok(new LoginResponse
        {
            Token = token,
            Email = user.Email ?? "",
            Roles = roles.ToList()
        });
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult<LoginResponse>> Register([FromBody] RegisterRequest body, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password))
            return BadRequest("Email and password are required.");

        var store = string.IsNullOrWhiteSpace(body.StoreSlug)
            ? null
            : await StoreResolutionHelper.ResolveActiveStoreAsync(_vendorDb, body.StoreSlug, cancellationToken);
        if (!string.IsNullOrWhiteSpace(body.StoreSlug) && store is null)
            return BadRequest("Unknown store. Use the store code from your link or the shop's exact name.");

        var email = body.Email.Trim();
        if (await _users.FindByEmailAsync(email) is not null)
            return Conflict("That email is already registered.");

        if (!await _roles.RoleExistsAsync("Customer"))
            return Problem("Customer role is missing. Run Scripts/SeedIdentityRoles.sql.", statusCode: 500);

        var user = new IdentityUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true
        };

        var create = await _users.CreateAsync(user, body.Password);
        if (!create.Succeeded)
            return BadRequest(string.Join(" ", create.Errors.Select(e => e.Description)));

        var addRole = await _users.AddToRoleAsync(user, "Customer");
        if (!addRole.Succeeded)
        {
            await _users.DeleteAsync(user);
            return BadRequest(string.Join(" ", addRole.Errors.Select(e => e.Description)));
        }

        if (store is not null)
        {
            await _vendorDb.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE AspNetUsers SET StoreId = {store.StoreId} WHERE Id = {user.Id}",
                cancellationToken);
        }

        var roles = await _users.GetRolesAsync(user);
        var token = await _jwtIssuer.IssueAsync(user, cancellationToken);
        return Ok(new LoginResponse
        {
            Token = token,
            Email = user.Email ?? "",
            Roles = roles.ToList()
        });
    }

}
