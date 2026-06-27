using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Interfaces;
using EcommerceWeb.Core.Interfaces;
using AttributeEntity = EcommerceWeb.Core.Entities.Attribute;

namespace EcommerceWeb.Application.Services;

public class AttributeService : IAttributeService
{
    private readonly IAttributeRepository _attributeRepository;

    public AttributeService(IAttributeRepository attributeRepository)
    {
        _attributeRepository = attributeRepository;
    }

    public async Task<IReadOnlyList<AttributeDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var attributes = await _attributeRepository.GetAllWithValuesAsync(cancellationToken);
        return attributes.Select(MapToDto).ToList();
    }

    public async Task<AttributeDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var attribute = await _attributeRepository.GetByIdWithValuesAsync(id, cancellationToken);
        return attribute is null ? null : MapToDto(attribute);
    }

    public async Task<AttributeDto> CreateAsync(SaveAttributeDto dto, CancellationToken cancellationToken = default)
    {
        var attribute = new AttributeEntity
        {
            Name = dto.Name.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        var values = NormalizeValues(dto.Values);
        var created = await _attributeRepository.CreateAsync(attribute, values, cancellationToken);
        return MapToDto(created);
    }

    public async Task<AttributeDto?> UpdateAsync(int id, SaveAttributeDto dto, CancellationToken cancellationToken = default)
    {
        var attribute = await _attributeRepository.GetByIdWithValuesAsync(id, cancellationToken);
        if (attribute is null)
        {
            return null;
        }

        attribute.Name = dto.Name.Trim();
        var values = NormalizeValues(dto.Values);
        await _attributeRepository.UpdateAsync(attribute, values, cancellationToken);

        var updated = await _attributeRepository.GetByIdWithValuesAsync(id, cancellationToken);
        return updated is null ? null : MapToDto(updated);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var attribute = await _attributeRepository.GetByIdWithValuesAsync(id, cancellationToken);
        if (attribute is null)
        {
            return false;
        }

        await _attributeRepository.DeleteAsync(id, cancellationToken);
        return true;
    }

    private static AttributeDto MapToDto(AttributeEntity attribute)
    {
        return new AttributeDto
        {
            Id = attribute.Id,
            Name = attribute.Name,
            Values = attribute.AttributeValues
                .OrderBy(v => v.Id)
                .Select(v => v.Value)
                .ToList(),
            Date = attribute.CreatedAt.ToString("yyyy-MM-dd")
        };
    }

    private static List<string> NormalizeValues(IEnumerable<string> values)
    {
        return values
            .Select(v => v.Trim())
            .Where(v => !string.IsNullOrWhiteSpace(v))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}
