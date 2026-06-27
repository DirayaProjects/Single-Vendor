namespace EcommerceWeb.Application.Dtos;

public class SubmitProductReviewDto
{
    public string UserId { get; set; } = null!;

    public decimal Rating { get; set; }

    public string Comment { get; set; } = null!;
}
