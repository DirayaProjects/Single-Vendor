using EcommerceWeb.Core.Entities;

namespace EcommerceWeb.Core.Interfaces;

public interface IDeliveryCityRepository
{
    Task<IReadOnlyList<DeliveryCity>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DeliveryCity>> GetActiveAsync(CancellationToken cancellationToken = default);

    Task<DeliveryCity?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<DeliveryCity> CreateAsync(DeliveryCity city, CancellationToken cancellationToken = default);

    Task UpdateAsync(DeliveryCity city, CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
