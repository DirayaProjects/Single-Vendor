using EcommerceWeb.Application.Dtos;

namespace EcommerceWeb.Application.Interfaces;

public interface IProductReviewService
{
    Task<IReadOnlyList<ProductReviewDto>> GetReviewsAsync(int productId, CancellationToken cancellationToken = default);

    Task<ProductReviewDto?> GetUserReviewAsync(string userId, int productId, CancellationToken cancellationToken = default);

    Task<ProductReviewDto> SubmitReviewAsync(int productId, SubmitProductReviewDto dto, CancellationToken cancellationToken = default);
}
