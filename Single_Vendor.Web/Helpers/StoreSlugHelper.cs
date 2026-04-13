using System.Text;
using System.Text.RegularExpressions;

namespace Single_Vendor.Web.Helpers;

public static class StoreSlugHelper
{
    /// <summary>Lowercase [a-z0-9-], max 100 chars; empty input returns null.</summary>
    public static string? NormalizeOrNull(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return null;

        var sb = new StringBuilder();
        foreach (var c in input.Trim().ToLowerInvariant())
        {
            if (c is >= 'a' and <= 'z' or >= '0' and <= '9' or '-')
                sb.Append(c);
            else if (char.IsWhiteSpace(c) || c is '_' or '.')
                sb.Append('-');
        }

        var s = Regex.Replace(sb.ToString(), "-{2,}", "-").Trim('-');
        if (string.IsNullOrEmpty(s))
            return null;
        return s.Length <= 100 ? s : s[..100];
    }
}
