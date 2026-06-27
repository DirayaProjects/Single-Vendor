using EcommerceWeb.Application.Dtos;

namespace EcommerceWeb.Application.Interfaces;

public interface IAttributeService
{
    Task<IReadOnlyList<AttributeDto>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<AttributeDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<AttributeDto> CreateAsync(SaveAttributeDto dto, CancellationToken cancellationToken = default);

    Task<AttributeDto?> UpdateAsync(int id, SaveAttributeDto dto, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
