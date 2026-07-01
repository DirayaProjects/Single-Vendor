using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Interfaces;
using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;

namespace EcommerceWeb.Application.Services;

public class DeliveryCityService : IDeliveryCityService
{
    private readonly IDeliveryCityRepository _repository;

    public DeliveryCityService(IDeliveryCityRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<DeliveryCityDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var cities = await _repository.GetAllAsync(cancellationToken);
        return cities.Select(MapToDto).ToList();
    }

    public async Task<IReadOnlyList<DeliveryCityDto>> GetActiveAsync(CancellationToken cancellationToken = default)
    {
        var cities = await _repository.GetActiveAsync(cancellationToken);
        return cities.Select(MapToDto).ToList();
    }

    public async Task<DeliveryCityDto> CreateAsync(SaveDeliveryCityDto dto, CancellationToken cancellationToken = default)
    {
        var city = new DeliveryCity
        {
            Name = dto.Name.Trim(),
            DeliveryFee = dto.DeliveryFee,
            IsActive = dto.IsActive,
            SortOrder = dto.SortOrder,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _repository.CreateAsync(city, cancellationToken);
        return MapToDto(created);
    }

    public async Task<DeliveryCityDto?> UpdateAsync(int id, SaveDeliveryCityDto dto, CancellationToken cancellationToken = default)
    {
        var city = await _repository.GetByIdAsync(id, cancellationToken);
        if (city is null) return null;

        city.Name = dto.Name.Trim();
        city.DeliveryFee = dto.DeliveryFee;
        city.IsActive = dto.IsActive;
        city.SortOrder = dto.SortOrder;
        city.UpdatedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(city, cancellationToken);
        return MapToDto(city);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var city = await _repository.GetByIdAsync(id, cancellationToken);
        if (city is null) return false;
        await _repository.DeleteAsync(id, cancellationToken);
        return true;
    }

    private static DeliveryCityDto MapToDto(DeliveryCity city) => new()
    {
        Id = city.Id,
        Name = city.Name,
        DeliveryFee = city.DeliveryFee,
        IsActive = city.IsActive,
        SortOrder = city.SortOrder
    };
}
