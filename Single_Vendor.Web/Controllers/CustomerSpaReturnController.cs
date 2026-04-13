using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Single_Vendor.Web.Helpers;
using Single_Vendor.Web.Services;

namespace Single_Vendor.Web.Controllers;

/// <summary>Finishes cookie-based external login by issuing a SPA JWT and redirecting to the storefront.</summary>
public class CustomerSpaReturnController : Controller
{
    private readonly SignInManager<IdentityUser> _signInManager;
    private readonly ICustomerJwtIssuer _jwtIssuer;
    private readonly IConfiguration _config;

    public CustomerSpaReturnController(
        SignInManager<IdentityUser> signInManager,
        ICustomerJwtIssuer jwtIssuer,
        IConfiguration config)
    {
        _signInManager = signInManager;
        _jwtIssuer = jwtIssuer;
        _config = config;
    }

    [Authorize]
    [HttpGet("/customer-spa/complete")]
    public async Task<IActionResult> Complete([FromQuery] string? returnUrl, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(returnUrl) || !SpaReturnUrlValidator.IsAllowed(_config, returnUrl, Request))
            return BadRequest("Invalid or missing return URL.");

        var user = await _signInManager.UserManager.GetUserAsync(User);
        if (user is null)
            return Unauthorized();

        var jwt = await _jwtIssuer.IssueAsync(user, cancellationToken);
        await _signInManager.SignOutAsync();

        var uri = new Uri(returnUrl);
        var withoutFragment = uri.GetLeftPart(UriPartial.Path) + uri.Query;
        return Redirect($"{withoutFragment}#sv_token={Uri.EscapeDataString(jwt)}");
    }
}
