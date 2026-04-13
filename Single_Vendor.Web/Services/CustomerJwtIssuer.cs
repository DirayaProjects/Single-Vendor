using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Single_Vendor.Infrastructure.Data;
using Single_Vendor.Web.Controllers.Api;

namespace Single_Vendor.Web.Services;

public class CustomerJwtIssuer : ICustomerJwtIssuer
{
    private readonly UserManager<IdentityUser> _users;
    private readonly IConfiguration _config;
    private readonly SingleVendorDbContext _vendorDb;

    public CustomerJwtIssuer(
        UserManager<IdentityUser> users,
        IConfiguration config,
        SingleVendorDbContext vendorDb)
    {
        _users = users;
        _config = config;
        _vendorDb = vendorDb;
    }

    public async Task<string> IssueAsync(IdentityUser user, CancellationToken cancellationToken = default)
    {
        var roles = await _users.GetRolesAsync(user);
        var customerSid = await GetCustomerStoreIdAsync(user.Id, roles, cancellationToken);
        return CreateJwt(user, roles, customerSid);
    }

    private async Task<int?> GetCustomerStoreIdAsync(string userId, IList<string> roles, CancellationToken cancellationToken)
    {
        if (!roles.Contains("Customer", StringComparer.OrdinalIgnoreCase))
            return null;

        return await _vendorDb.AspNetUsers.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.StoreId)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private string CreateJwt(IdentityUser user, IList<string> roles, int? customerStoreId)
    {
        var key = _config["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is not configured.");
        var issuer = _config["Jwt:Issuer"];
        var audience = _config["Jwt:Audience"];

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var creds = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        if (!string.IsNullOrEmpty(user.Email))
            claims.Add(new Claim(JwtRegisteredClaimNames.Email, user.Email));
        foreach (var r in roles)
            claims.Add(new Claim(ClaimTypes.Role, r));
        if (customerStoreId.HasValue)
            claims.Add(new Claim(AuthController.StoreIdClaimType, customerStoreId.Value.ToString()));

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
