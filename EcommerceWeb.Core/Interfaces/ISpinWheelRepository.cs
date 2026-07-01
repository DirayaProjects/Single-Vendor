using EcommerceWeb.Core.Entities;

namespace EcommerceWeb.Core.Interfaces;

public interface ISpinWheelRepository
{
    Task<IReadOnlyList<SpinWheelPrize>> GetAllPrizesAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SpinWheelPrize>> GetActivePrizesAsync(CancellationToken cancellationToken = default);

    Task<SpinWheelPrize?> GetPrizeByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<SpinWheelPrize> CreatePrizeAsync(SpinWheelPrize prize, CancellationToken cancellationToken = default);

    Task UpdatePrizeAsync(SpinWheelPrize prize, CancellationToken cancellationToken = default);

    Task DeletePrizeAsync(int id, CancellationToken cancellationToken = default);

    Task<UserSpinWheelResult?> GetUnusedResultAsync(string userId, CancellationToken cancellationToken = default);

    Task<UserSpinWheelResult> CreateResultAsync(UserSpinWheelResult result, CancellationToken cancellationToken = default);

    Task MarkResultUsedAsync(int resultId, int orderId, CancellationToken cancellationToken = default);
}
