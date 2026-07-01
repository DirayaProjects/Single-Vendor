using EcommerceWeb.Application.Dtos;

namespace EcommerceWeb.Application.Interfaces;

public interface ISpinWheelService
{
    Task<IReadOnlyList<SpinWheelPrizeDto>> GetAllPrizesAsync(CancellationToken cancellationToken = default);

    Task<SpinWheelPrizeDto> CreatePrizeAsync(SaveSpinWheelPrizeDto dto, CancellationToken cancellationToken = default);

    Task<SpinWheelPrizeDto?> UpdatePrizeAsync(int id, SaveSpinWheelPrizeDto dto, CancellationToken cancellationToken = default);

    Task<bool> DeletePrizeAsync(int id, CancellationToken cancellationToken = default);

    Task<SpinWheelStatusDto> GetStatusAsync(string userId, CancellationToken cancellationToken = default);

    Task<SpinWheelResultDto> SpinAsync(string userId, CancellationToken cancellationToken = default);
}
