namespace EcommerceWeb.Application.Dtos;

public class SaveProductDto
{
    public string Name { get; set; } = null!;

    public string? Details { get; set; }

    public int CategoryId { get; set; }

    public string? Brand { get; set; }

    public decimal Price { get; set; }

    public decimal? SalePrice { get; set; }

    public int Quantity { get; set; }

    public List<string> Images { get; set; } = [];

    public Dictionary<string, List<string>> Attributes { get; set; } = [];
}
