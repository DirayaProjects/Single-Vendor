using EcommerceWeb.Core.Entities;

namespace EcommerceWeb.Core.Interfaces;

public interface IStorefrontRepository
{
    Task<WebsiteSetting?> GetSettingsAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Category>> GetActiveCategoriesAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Product>> GetActiveProductsAsync(CancellationToken cancellationToken = default);

    Task<Product?> GetActiveProductByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Testimonial>> GetActiveTestimonialsAsync(CancellationToken cancellationToken = default);
}
