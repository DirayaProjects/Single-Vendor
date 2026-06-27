namespace EcommerceWeb.Application.Dtos;

public class SeriesPointDto
{
    public string Date { get; set; } = null!;

    public Dictionary<string, decimal> Values { get; set; } = new();
}
