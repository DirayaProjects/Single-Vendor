using EcommerceWeb.Core.Entities;

namespace EcommerceWeb.Core.Interfaces;

public interface IProductReviewRepository
{
    Task<IReadOnlyList<Testimonial>> GetByProductIdAsync(int productId, CancellationToken cancellationToken = default);

    Task<Testimonial?> GetUserReviewForProductAsync(string userId, int productId, CancellationToken cancellationToken = default);

    Task<Testimonial> CreateAsync(Testimonial testimonial, CancellationToken cancellationToken = default);

    Task UpdateAsync(Testimonial testimonial, CancellationToken cancellationToken = default);

    Task<decimal> GetAverageRatingForProductAsync(int productId, CancellationToken cancellationToken = default);

    Task UpdateProductRatingAsync(int productId, decimal rating, CancellationToken cancellationToken = default);
}
