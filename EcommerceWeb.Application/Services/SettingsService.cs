using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Helpers;
using EcommerceWeb.Application.Interfaces;
using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;

namespace EcommerceWeb.Application.Services;

public class SettingsService : ISettingsService
{
    private const int MaxImageUrlLength = 1000;

    private readonly ISettingsRepository _settingsRepository;

    public SettingsService(ISettingsRepository settingsRepository)
    {
        _settingsRepository = settingsRepository;
    }

    public async Task<SettingsDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var settings = await _settingsRepository.GetAsync(cancellationToken);
        return settings is null ? new SettingsDto() : MapToDto(settings);
    }

    public async Task<SettingsDto> UpdateAsync(SaveSettingsDto dto, CancellationToken cancellationToken = default)
    {
        var settings = new WebsiteSetting
        {
            LogoName = dto.LogoName,
            LogoUrl = NormalizeImageUrl(dto.Logo),
            BannerUrl = NormalizeImageUrl(dto.Banner),
            Phone = dto.Phone,
            FacebookUrl = dto.Facebook,
            InstagramUrl = dto.Instagram,
            TwitterUrl = dto.Twitter,
            TikTokUrl = dto.Tiktok,
            SpinWheelEnabled = dto.Features.SpinWheelEnabled,
            SpinWheelVisible = dto.Features.SpinWheelVisible,
            FirstOrderDiscountEnabled = dto.Features.FirstOrderDiscountEnabled,
            FirstOrderDiscountPercent = dto.Features.FirstOrderDiscountPercent,
            FirstOrderDiscountAmount = dto.Features.FirstOrderDiscountAmount,
            GeneralDiscountsEnabled = dto.Features.GeneralDiscountsEnabled,
            UpdatedAt = DateTime.UtcNow
        };

        var saved = await _settingsRepository.UpsertAsync(settings, cancellationToken);
        return MapToDto(saved);
    }

    private static SettingsDto MapToDto(WebsiteSetting settings)
    {
        return new SettingsDto
        {
            Id = settings.Id,
            LogoName = settings.LogoName,
            Logo = settings.LogoUrl,
            Banner = settings.BannerUrl,
            Phone = settings.Phone,
            Facebook = settings.FacebookUrl,
            Instagram = settings.InstagramUrl,
            Twitter = settings.TwitterUrl,
            Tiktok = settings.TikTokUrl,
            Slug = SlugHelper.FromSettings(settings),
            Features = MapFeatures(settings)
        };
    }

    internal static FeatureSettingsDto MapFeatures(WebsiteSetting settings) => new()
    {
        SpinWheelEnabled = settings.SpinWheelEnabled,
        SpinWheelVisible = settings.SpinWheelVisible,
        FirstOrderDiscountEnabled = settings.FirstOrderDiscountEnabled,
        FirstOrderDiscountPercent = settings.FirstOrderDiscountPercent,
        FirstOrderDiscountAmount = settings.FirstOrderDiscountAmount,
        GeneralDiscountsEnabled = settings.GeneralDiscountsEnabled
    };

    private static string? NormalizeImageUrl(string? image)
    {
        if (string.IsNullOrWhiteSpace(image))
        {
            return null;
        }

        return image.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase)
            || image.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            || image.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
            ? image.Length <= MaxImageUrlLength ? image : null
            : null;
    }
}
