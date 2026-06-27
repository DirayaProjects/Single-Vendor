namespace EcommerceWeb.Application.Dtos;

public class AttributeDto
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public List<string> Values { get; set; } = [];

    public string Date { get; set; } = null!;
}
