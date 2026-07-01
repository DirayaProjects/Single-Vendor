using EcommerceWeb.Core.Entities;

namespace EcommerceWeb.Core.Interfaces;

public interface IFavoriteRepository
{
    Task<IReadOnlyList<Favorite>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(string userId, int productId, CancellationToken cancellationToken = default);

    Task AddAsync(string userId, int productId, CancellationToken cancellationToken = default);

    Task RemoveAsync(string userId, int productId, CancellationToken cancellationToken = default);
}
