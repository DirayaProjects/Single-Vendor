using EcommerceWeb.Core.Entities;

namespace EcommerceWeb.Core.Interfaces;

public interface IUserProfileRepository
{
    Task<UserProfile?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);

    Task<UserProfile> EnsureExistsAsync(string userId, string? fullName = null, CancellationToken cancellationToken = default);

    Task MarkFirstOrderDiscountUsedAsync(string userId, CancellationToken cancellationToken = default);

    Task MarkHasSpunWheelAsync(string userId, CancellationToken cancellationToken = default);

    Task<bool> HasPlacedOrderAsync(string userId, CancellationToken cancellationToken = default);
}
