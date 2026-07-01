using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Interfaces;
using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;

namespace EcommerceWeb.Application.Services;

public class PromoAdService : IPromoAdService
{
    private const int MaxImageUrlLength = 1000;
    private readonly IPromoAdRepository _repository;

    public PromoAdService(IPromoAdRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<PromoAdDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var ads = await _repository.GetAllAsync(cancellationToken);
        return ads.Select(MapToDto).ToList();
    }

    public async Task<IReadOnlyList<PromoAdDto>> GetActiveAsync(CancellationToken cancellationToken = default)
    {
        var ads = await _repository.GetActiveAsync(cancellationToken);
        return ads.Select(MapToDto).ToList();
    }

    public async Task<PromoAdDto> CreateAsync(SavePromoAdDto dto, CancellationToken cancellationToken = default)
    {
        var ad = BuildEntity(dto);
        ad.CreatedAt = DateTime.UtcNow;
        var created = await _repository.CreateAsync(ad, cancellationToken);
        return MapToDto(created);
    }

    public async Task<PromoAdDto?> UpdateAsync(int id, SavePromoAdDto dto, CancellationToken cancellationToken = default)
    {
        var ad = await _repository.GetByIdAsync(id, cancellationToken);
        if (ad is null) return null;

        ad.Title = dto.Title.Trim();
        ad.Subtitle = dto.Subtitle;
        ad.Description = dto.Description;
        ad.ImageUrl = NormalizeImage(dto.Image);
        ad.LinkUrl = dto.LinkUrl;
        ad.ButtonText = dto.ButtonText;
        ad.StartDate = ParseDate(dto.StartDate);
        ad.EndDate = ParseDate(dto.EndDate);
        ad.IsActive = dto.IsActive;
        ad.SortOrder = dto.SortOrder;
        ad.UpdatedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(ad, cancellationToken);
        return MapToDto(ad);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var ad = await _repository.GetByIdAsync(id, cancellationToken);
        if (ad is null) return false;
        await _repository.DeleteAsync(id, cancellationToken);
        return true;
    }

    internal static PromoAdDto MapToDto(PromoAd ad) => new()
    {
        Id = ad.Id,
        Title = ad.Title,
        Subtitle = ad.Subtitle,
        Description = ad.Description,
        Image = ad.ImageUrl,
        LinkUrl = ad.LinkUrl,
        ButtonText = ad.ButtonText,
        StartDate = ad.StartDate?.ToString("yyyy-MM-dd"),
        EndDate = ad.EndDate?.ToString("yyyy-MM-dd"),
        IsActive = ad.IsActive,
        SortOrder = ad.SortOrder
    };

    private static PromoAd BuildEntity(SavePromoAdDto dto) => new()
    {
        Title = dto.Title.Trim(),
        Subtitle = dto.Subtitle,
        Description = dto.Description,
        ImageUrl = NormalizeImage(dto.Image),
        LinkUrl = dto.LinkUrl,
        ButtonText = dto.ButtonText,
        StartDate = ParseDate(dto.StartDate),
        EndDate = ParseDate(dto.EndDate),
        IsActive = dto.IsActive,
        SortOrder = dto.SortOrder
    };

    private static DateTime? ParseDate(string? value)
        => DateTime.TryParse(value, out var dt) ? dt.Date : null;

    private static string? NormalizeImage(string? image)
    {
        if (string.IsNullOrWhiteSpace(image)) return null;
        return image.Length <= MaxImageUrlLength ? image : null;
    }
}
