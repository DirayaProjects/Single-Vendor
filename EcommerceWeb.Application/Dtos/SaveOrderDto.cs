namespace EcommerceWeb.Application.Dtos;

public class SaveOrderDto
{
    public string Customer { get; set; } = null!;

    public decimal Total { get; set; }

    public string Status { get; set; } = null!;

    public string Date { get; set; } = null!;

    public string? Description { get; set; }
}
