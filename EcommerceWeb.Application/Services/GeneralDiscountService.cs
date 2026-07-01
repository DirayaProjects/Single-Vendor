using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Interfaces;
using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;

namespace EcommerceWeb.Application.Services;

public class GeneralDiscountService : IGeneralDiscountService
{
    private readonly IGeneralDiscountRepository _repository;

    public GeneralDiscountService(IGeneralDiscountRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<GeneralDiscountDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var discounts = await _repository.GetAllWithProductsAsync(cancellationToken);
        return discounts.Select(MapToDto).ToList();
    }

    public async Task<GeneralDiscountDto> CreateAsync(SaveGeneralDiscountDto dto, CancellationToken cancellationToken = default)
    {
        ValidateDto(dto);

        var discount = new GeneralDiscount
        {
            Name = dto.Name.Trim(),
            DiscountPercent = dto.DiscountPercent,
            DiscountAmount = dto.DiscountAmount,
            IsActive = dto.IsActive,
            StartDate = ParseDate(dto.StartDate),
            EndDate = ParseDate(dto.EndDate),
            CreatedAt = DateTime.UtcNow
        };

        var created = await _repository.CreateAsync(discount, dto.ProductIds, cancellationToken);
        return MapToDto(created);
    }

    public async Task<GeneralDiscountDto?> UpdateAsync(int id, SaveGeneralDiscountDto dto, CancellationToken cancellationToken = default)
    {
        ValidateDto(dto);

        var existing = await _repository.GetByIdWithProductsAsync(id, cancellationToken);
        if (existing is null) return null;

        existing.Name = dto.Name.Trim();
        existing.DiscountPercent = dto.DiscountPercent;
        existing.DiscountAmount = dto.DiscountAmount;
        existing.IsActive = dto.IsActive;
        existing.StartDate = ParseDate(dto.StartDate);
        existing.EndDate = ParseDate(dto.EndDate);
        existing.UpdatedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(existing, dto.ProductIds, cancellationToken);
        var loaded = await _repository.GetByIdWithProductsAsync(id, cancellationToken);
        return loaded is null ? null : MapToDto(loaded);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var discount = await _repository.GetByIdWithProductsAsync(id, cancellationToken);
        if (discount is null) return false;
        await _repository.DeleteAsync(id, cancellationToken);
        return true;
    }

    private static void ValidateDto(SaveGeneralDiscountDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            throw new InvalidOperationException("Discount name is required.");
        }

        if (dto.DiscountPercent is null && dto.DiscountAmount is null)
        {
            throw new InvalidOperationException("Discount percent or amount is required.");
        }
    }

    private static DateTime? ParseDate(string? value)
        => DateTime.TryParse(value, out var dt) ? dt.Date : null;

    private static GeneralDiscountDto MapToDto(GeneralDiscount discount) => new()
    {
        Id = discount.Id,
        Name = discount.Name,
        DiscountPercent = discount.DiscountPercent,
        DiscountAmount = discount.DiscountAmount,
        IsActive = discount.IsActive,
        StartDate = discount.StartDate?.ToString("yyyy-MM-dd"),
        EndDate = discount.EndDate?.ToString("yyyy-MM-dd"),
        ProductIds = discount.Products.Select(p => p.Id).ToList()
    };
}
