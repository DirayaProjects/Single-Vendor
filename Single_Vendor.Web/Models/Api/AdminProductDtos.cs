namespace Single_Vendor.Web.Models.Api;

public sealed class ProductAdminResponse
{
    public int ProductId { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string? Brand { get; set; }
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public decimal RatingAverage { get; set; }
    public int RatingCount { get; set; }
    public int FavoriteCount { get; set; }
    public bool IsActive { get; set; }
    public IReadOnlyList<string> ImageUrls { get; set; } = Array.Empty<string>();
    public IReadOnlyDictionary<string, string> Specifications { get; set; } =
        new Dictionary<string, string>();
}

public sealed class ProductCreateRequest
{
    public int? CategoryId { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string? Brand { get; set; }
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public IReadOnlyList<string>? ImageUrls { get; set; }
    public IReadOnlyDictionary<string, string>? Specifications { get; set; }
}

public sealed class ProductUpdateRequest
{
    public int? CategoryId { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string? Brand { get; set; }
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public bool IsActive { get; set; } = true;
    public IReadOnlyList<string>? ImageUrls { get; set; }
    public IReadOnlyDictionary<string, string>? Specifications { get; set; }
}
