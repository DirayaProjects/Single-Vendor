namespace EcommerceWeb.Application.Helpers;

public static class ProductReviewHelper
{
    private const string Prefix = "[Product:";

    public static string BuildComment(int productId, string comment)
    {
        return $"{Prefix}{productId}]{comment.Trim()}";
    }

    public static bool IsProductReview(string? comment)
    {
        return !string.IsNullOrWhiteSpace(comment) && comment.StartsWith(Prefix, StringComparison.Ordinal);
    }

    public static int? GetProductId(string? comment)
    {
        if (!IsProductReview(comment))
        {
            return null;
        }

        var end = comment!.IndexOf(']', Prefix.Length - 1);
        if (end <= Prefix.Length)
        {
            return null;
        }

        var idPart = comment.Substring(Prefix.Length, end - Prefix.Length);
        return int.TryParse(idPart, out var id) ? id : null;
    }

    public static string GetDisplayComment(string comment)
    {
        if (!IsProductReview(comment))
        {
            return comment;
        }

        var end = comment.IndexOf(']', Prefix.Length - 1);
        return end >= 0 && end + 1 < comment.Length
            ? comment[(end + 1)..].Trim()
            : comment;
    }
}
