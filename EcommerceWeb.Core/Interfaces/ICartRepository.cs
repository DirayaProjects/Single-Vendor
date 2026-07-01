using EcommerceWeb.Core.Entities;

namespace EcommerceWeb.Core.Interfaces;

public interface ICartRepository
{
    Task<IReadOnlyList<CartItem>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);

    Task<CartItem?> GetByUserAndProductAsync(string userId, int productId, CancellationToken cancellationToken = default);

    Task<CartItem?> GetByUserProductAndAttributesAsync(string userId, int productId, string selectedAttributesJson, CancellationToken cancellationToken = default);

    Task<CartItem> AddOrUpdateAsync(CartItem item, CancellationToken cancellationToken = default);

    Task UpdateQuantityAsync(int cartItemId, int quantity, CancellationToken cancellationToken = default);

    Task RemoveAsync(int cartItemId, CancellationToken cancellationToken = default);

    Task ClearAsync(string userId, CancellationToken cancellationToken = default);
}
