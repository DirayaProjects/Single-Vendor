namespace EcommerceWeb.Application.Dtos;

public class MonthlyRevenueOrdersDto
{
    public string Month { get; set; } = null!;

    public decimal Revenue { get; set; }

    public int Orders { get; set; }
}
