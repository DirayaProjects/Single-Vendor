using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;
using EcommerceWeb.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EcommerceWeb.Infrastructure.Repositories;

public class SettingsRepository : ISettingsRepository
{
    private readonly EcommerceWebDbContext _context;

    public SettingsRepository(EcommerceWebDbContext context)
    {
        _context = context;
    }

    public Task<WebsiteSetting?> GetAsync(CancellationToken cancellationToken = default)
    {
        return _context.WebsiteSettings
            .AsNoTracking()
            .OrderBy(s => s.Id)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<WebsiteSetting> UpsertAsync(WebsiteSetting settings, CancellationToken cancellationToken = default)
    {
        var existing = await _context.WebsiteSettings
            .OrderBy(s => s.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (existing is null)
        {
            _context.WebsiteSettings.Add(settings);
            await _context.SaveChangesAsync(cancellationToken);
            return settings;
        }

        existing.LogoName = settings.LogoName;
        existing.LogoUrl = settings.LogoUrl;
        existing.BannerUrl = settings.BannerUrl;
        existing.Phone = settings.Phone;
        existing.FacebookUrl = settings.FacebookUrl;
        existing.InstagramUrl = settings.InstagramUrl;
        existing.TwitterUrl = settings.TwitterUrl;
        existing.TikTokUrl = settings.TikTokUrl;
        existing.SpinWheelEnabled = settings.SpinWheelEnabled;
        existing.SpinWheelVisible = settings.SpinWheelVisible;
        existing.FirstOrderDiscountEnabled = settings.FirstOrderDiscountEnabled;
        existing.FirstOrderDiscountPercent = settings.FirstOrderDiscountPercent;
        existing.FirstOrderDiscountAmount = settings.FirstOrderDiscountAmount;
        existing.GeneralDiscountsEnabled = settings.GeneralDiscountsEnabled;
        existing.UpdatedAt = settings.UpdatedAt;

        await _context.SaveChangesAsync(cancellationToken);
        return existing;
    }
}
