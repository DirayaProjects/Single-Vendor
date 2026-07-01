using EcommerceWeb.Application.Dtos;

namespace EcommerceWeb.Application.Interfaces;

public interface IPromoAdService
{
    Task<IReadOnlyList<PromoAdDto>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PromoAdDto>> GetActiveAsync(CancellationToken cancellationToken = default);

    Task<PromoAdDto> CreateAsync(SavePromoAdDto dto, CancellationToken cancellationToken = default);

    Task<PromoAdDto?> UpdateAsync(int id, SavePromoAdDto dto, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
