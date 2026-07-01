using EcommerceWeb.Core.Entities;

namespace EcommerceWeb.Core.Interfaces;

public interface IGeneralDiscountRepository
{
    Task<IReadOnlyList<GeneralDiscount>> GetAllWithProductsAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<GeneralDiscount>> GetActiveWithProductsAsync(CancellationToken cancellationToken = default);

    Task<GeneralDiscount?> GetByIdWithProductsAsync(int id, CancellationToken cancellationToken = default);

    Task<GeneralDiscount> CreateAsync(GeneralDiscount discount, IEnumerable<int> productIds, CancellationToken cancellationToken = default);

    Task UpdateAsync(GeneralDiscount discount, IEnumerable<int> productIds, CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
