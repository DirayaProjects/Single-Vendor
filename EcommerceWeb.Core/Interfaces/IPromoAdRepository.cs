using EcommerceWeb.Core.Entities;

namespace EcommerceWeb.Core.Interfaces;

public interface IPromoAdRepository
{
    Task<IReadOnlyList<PromoAd>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PromoAd>> GetActiveAsync(CancellationToken cancellationToken = default);

    Task<PromoAd?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<PromoAd> CreateAsync(PromoAd ad, CancellationToken cancellationToken = default);

    Task UpdateAsync(PromoAd ad, CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
