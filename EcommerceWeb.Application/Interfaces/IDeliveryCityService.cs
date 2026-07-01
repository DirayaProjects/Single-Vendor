using EcommerceWeb.Application.Dtos;

namespace EcommerceWeb.Application.Interfaces;

public interface IDeliveryCityService
{
    Task<IReadOnlyList<DeliveryCityDto>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DeliveryCityDto>> GetActiveAsync(CancellationToken cancellationToken = default);

    Task<DeliveryCityDto> CreateAsync(SaveDeliveryCityDto dto, CancellationToken cancellationToken = default);

    Task<DeliveryCityDto?> UpdateAsync(int id, SaveDeliveryCityDto dto, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
