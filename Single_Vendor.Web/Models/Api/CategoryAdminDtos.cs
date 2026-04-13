namespace Single_Vendor.Web.Models.Api;

public sealed class CategoryAdminResponse
{
    public int CategoryId { get; set; }
    public string Name { get; set; } = "";
    public string? ImageUrl { get; set; }
    public string? Slug { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}

public sealed class CategoryCreateRequest
{
    public string Name { get; set; } = "";
    public string? ImageUrl { get; set; }
    public int? DisplayOrder { get; set; }
}

public sealed class CategoryUpdateRequest
{
    public string Name { get; set; } = "";
    public string? ImageUrl { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
