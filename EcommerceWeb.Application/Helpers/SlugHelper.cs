using System.Text;
using System.Text.RegularExpressions;
using EcommerceWeb.Core.Entities;

namespace EcommerceWeb.Application.Helpers;

public static partial class SlugHelper
{
    public static string? Normalize(string? slug)
    {
        if (string.IsNullOrWhiteSpace(slug))
        {
            return null;
        }

        var normalized = slug.Trim().ToLowerInvariant();
        normalized = NonSlugCharsRegex().Replace(normalized, "-");
        normalized = MultiDashRegex().Replace(normalized, "-").Trim('-');

        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }

    public static string FromSettings(WebsiteSetting settings)
    {
        if (!string.IsNullOrWhiteSpace(settings.LogoName))
        {
            return Normalize(SlugifyName(settings.LogoName)) ?? $"shop-{settings.Id}";
        }

        return $"shop-{settings.Id}";
    }

    public static bool Matches(WebsiteSetting settings, string slug)
    {
        var requested = Normalize(slug);
        if (requested is null)
        {
            return false;
        }

        return string.Equals(FromSettings(settings), requested, StringComparison.OrdinalIgnoreCase);
    }

    private static string SlugifyName(string name)
    {
        var builder = new StringBuilder();
        foreach (var ch in name.Trim().ToLowerInvariant())
        {
            builder.Append(char.IsLetterOrDigit(ch) ? ch : '-');
        }

        return builder.ToString();
    }

    [GeneratedRegex(@"[^a-z0-9\-]")]
    private static partial Regex NonSlugCharsRegex();

    [GeneratedRegex(@"-{2,}")]
    private static partial Regex MultiDashRegex();
}
