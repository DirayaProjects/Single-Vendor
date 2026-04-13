using System.Text;
using System.Text.RegularExpressions;

namespace Single_Vendor.Web.Helpers;

public static class SlugHelper
{
    public static string Slugify(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return "category";

        var sb = new StringBuilder();
        foreach (var c in name.Trim().ToLowerInvariant())
        {
            if (c is >= 'a' and <= 'z' or >= '0' and <= '9')
                sb.Append(c);
            else if (char.IsWhiteSpace(c) || c is '-' or '_')
                sb.Append('-');
        }

        var result = Regex.Replace(sb.ToString(), "-{2,}", "-").Trim('-');
        return string.IsNullOrEmpty(result) ? "category" : result;
    }
}
