using EcommerceWeb.Application.Dtos;

namespace EcommerceWeb.Application.Interfaces;

public interface IStorefrontService
{
    Task<StorefrontBootstrapDto?> GetBootstrapAsync(string slug, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<StorefrontProductDto>> GetProductsAsync(
        string slug,
        int? categoryId = null,
        string? search = null,
        CancellationToken cancellationToken = default);

    Task<StorefrontProductDto?> GetProductAsync(string slug, int id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PromoAdDto>> GetPromoAdsAsync(string slug, CancellationToken cancellationToken = default);
}
