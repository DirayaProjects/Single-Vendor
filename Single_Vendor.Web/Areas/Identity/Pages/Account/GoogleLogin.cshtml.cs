using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Single_Vendor.Web.Helpers;

namespace Single_Vendor.Web.Areas.Identity.Pages.Account;

[AllowAnonymous]
public class GoogleLoginModel : PageModel
{
    private readonly SignInManager<IdentityUser> _signInManager;
    private readonly IConfiguration _config;

    public GoogleLoginModel(SignInManager<IdentityUser> signInManager, IConfiguration config)
    {
        _signInManager = signInManager;
        _config = config;
    }

    public IActionResult OnGet(string? storeSlug, string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(_config["Authentication:Google:ClientId"]))
        {
            const string html =
                "<!DOCTYPE html><html><head><meta charset=\"utf-8\"/><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/><title>Google sign-in</title></head>"
                + "<body style=\"font-family:system-ui,sans-serif;padding:1.5rem;max-width:40rem;line-height:1.5\">"
                + "<p><strong>Google sign-in is not configured on the server.</strong></p>"
                + "<p>Set <code>Authentication:Google:ClientId</code> and <code>Authentication:Google:ClientSecret</code> "
                + "(User Secrets, e.g. <code>dotnet user-secrets set \"Authentication:Google:ClientId\" \"…\"</code>, or appsettings), then restart the API.</p>"
                + "<p>In Google Cloud Console, add an authorized redirect URI for your API origin, for example "
                + "<code>https://localhost:7182/signin-google</code> (match your HTTPS port from launchSettings).</p>"
                + "<p><a href=\"javascript:history.back()\">Go back</a></p></body></html>";
            return Content(html, "text/html; charset=utf-8");
        }

        var spaReturn = string.IsNullOrWhiteSpace(returnUrl)
            ? $"{Request.Scheme}://{Request.Host.Value}{Request.PathBase}/"
            : returnUrl.Trim();

        if (!SpaReturnUrlValidator.IsAllowed(_config, spaReturn, Request))
            return BadRequest("Invalid return URL for this application.");

        var bridge = Url.Action("Complete", "CustomerSpaReturn", new { returnUrl = spaReturn }, Request.Scheme, Request.Host.Value);
        if (string.IsNullOrEmpty(bridge))
            return BadRequest("Could not build login callback URL.");

        var callbackUrl = Url.Page(
            "/Account/ExternalLogin",
            pageHandler: "Callback",
            values: new { returnUrl = bridge },
            protocol: Request.Scheme);

        if (string.IsNullOrEmpty(callbackUrl))
            return BadRequest("Could not build external login callback URL.");

        var properties = _signInManager.ConfigureExternalAuthenticationProperties("Google", callbackUrl);
        var normalized = StoreSlugHelper.NormalizeOrNull(storeSlug);
        if (!string.IsNullOrEmpty(normalized))
            properties.Items["sv_store_slug"] = normalized;
        return Challenge(properties, "Google");
    }
}
