using System.Text.Json;
using EcommerceWeb.Core.Entities;

namespace EcommerceWeb.Application.Helpers;

public static class CartAttributeHelper
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    public static string NormalizeToJson(Dictionary<string, string>? attributes)
    {
        if (attributes is null || attributes.Count == 0)
        {
            return "{}";
        }

        var normalized = attributes
            .Where(kv => !string.IsNullOrWhiteSpace(kv.Key) && !string.IsNullOrWhiteSpace(kv.Value))
            .ToDictionary(kv => kv.Key.Trim(), kv => kv.Value.Trim(), StringComparer.OrdinalIgnoreCase);

        return JsonSerializer.Serialize(
            normalized.OrderBy(kv => kv.Key, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(kv => kv.Key, kv => kv.Value, StringComparer.Ordinal),
            JsonOptions);
    }

    public static Dictionary<string, string> ParseFromJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json) || json == "{}")
        {
            return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }

        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, string>>(json, JsonOptions)
                ?? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }
        catch
        {
            return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }
    }

    public static Dictionary<string, HashSet<string>> GetProductAttributeOptions(Product product)
    {
        return product.AttributeValues
            .Where(v => v.Attribute is not null && !string.IsNullOrWhiteSpace(v.Value))
            .GroupBy(v => v.Attribute!.Name)
            .ToDictionary(
                g => g.Key,
                g => g.Select(v => v.Value).ToHashSet(StringComparer.OrdinalIgnoreCase),
                StringComparer.OrdinalIgnoreCase);
    }

    public static void ValidateSelectedAttributes(Product product, Dictionary<string, string>? selected)
    {
        var options = GetProductAttributeOptions(product);
        var chosen = selected ?? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        if (options.Count == 0)
        {
            return;
        }

        foreach (var (name, values) in options)
        {
            if (!chosen.TryGetValue(name, out var value) || string.IsNullOrWhiteSpace(value))
            {
                throw new InvalidOperationException($"Please select {name}.");
            }

            if (!values.Contains(value.Trim()))
            {
                throw new InvalidOperationException($"Invalid value for {name}.");
            }
        }
    }
}
