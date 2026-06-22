namespace Single_Vendor.Web.Models.Api;

public sealed class AttributeAdminResponse
{
    public int AttributeId { get; set; }
    public string Name { get; set; } = "";
    public DateOnly DateAdded { get; set; }
    public IReadOnlyList<string> Values { get; set; } = Array.Empty<string>();
}

public sealed class AttributeCreateRequest
{
    public string Name { get; set; } = "";
    public IReadOnlyList<string> Values { get; set; } = Array.Empty<string>();
}

public sealed class AttributeUpdateRequest
{
    public string Name { get; set; } = "";
    public IReadOnlyList<string> Values { get; set; } = Array.Empty<string>();
}
