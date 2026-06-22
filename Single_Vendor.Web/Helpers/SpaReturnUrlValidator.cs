namespace Single_Vendor.Web.Helpers;

/// <summary>Validates absolute URLs used after Google / external login before redirecting back to the SPA.</summary>
public static class SpaReturnUrlValidator
{
    public static bool IsAllowed(IConfiguration config, string returnUrl, HttpRequest request)
    {
        if (string.IsNullOrWhiteSpace(returnUrl))
            return false;

        if (!Uri.TryCreate(returnUrl.Trim(), UriKind.Absolute, out var uri))
            return false;

        if (uri.Scheme is not ("http" or "https"))
            return false;

        if (string.IsNullOrEmpty(uri.Host))
            return false;

        if (IsLocalHost(uri.Host))
            return true;

        var prefixes = config.GetSection("Spa:AllowedReturnPrefixes").Get<string[]>() ?? Array.Empty<string>();
        foreach (var p in prefixes)
        {
            if (string.IsNullOrWhiteSpace(p))
                continue;
            var prefix = p.Trim().TrimEnd('/');
            if (returnUrl.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        var requestHost = request.Host.Host;
        if (string.Equals(uri.Host, requestHost, StringComparison.OrdinalIgnoreCase))
            return true;

        return false;
    }

    private static bool IsLocalHost(string host) =>
        host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
        || host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase)
        || host.Equals("[::1]", StringComparison.OrdinalIgnoreCase);
}
