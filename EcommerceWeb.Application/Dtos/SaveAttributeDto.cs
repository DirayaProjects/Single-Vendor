namespace EcommerceWeb.Application.Dtos;

public class SaveAttributeDto
{
    public string Name { get; set; } = null!;

    public List<string> Values { get; set; } = [];
}
