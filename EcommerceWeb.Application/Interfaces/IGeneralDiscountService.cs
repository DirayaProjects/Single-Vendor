using EcommerceWeb.Application.Dtos;

namespace EcommerceWeb.Application.Interfaces;

public interface IGeneralDiscountService
{
    Task<IReadOnlyList<GeneralDiscountDto>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<GeneralDiscountDto> CreateAsync(SaveGeneralDiscountDto dto, CancellationToken cancellationToken = default);

    Task<GeneralDiscountDto?> UpdateAsync(int id, SaveGeneralDiscountDto dto, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
