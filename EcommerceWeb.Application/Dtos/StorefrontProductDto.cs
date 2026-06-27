namespace EcommerceWeb.Application.Dtos;

public class StorefrontProductDto
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Details { get; set; }

    public int CategoryId { get; set; }

    public string Category { get; set; } = null!;

    public string? Brand { get; set; }

    public decimal Price { get; set; }

    public int Quantity { get; set; }

    public decimal Rating { get; set; }

    public int Favorites { get; set; }

    public List<string> Images { get; set; } = [];

    public Dictionary<string, List<string>> Attributes { get; set; } = [];
}
