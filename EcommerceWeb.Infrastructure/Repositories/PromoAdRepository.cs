using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;
using EcommerceWeb.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EcommerceWeb.Infrastructure.Repositories;

public class PromoAdRepository : IPromoAdRepository
{
    private readonly EcommerceWebDbContext _context;

    public PromoAdRepository(EcommerceWebDbContext context)
    {
        _context = context;
    }

    public Task<IReadOnlyList<PromoAd>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return _context.PromoAds
            .AsNoTracking()
            .OrderBy(a => a.SortOrder)
            .ThenByDescending(a => a.Id)
            .ToListAsync(cancellationToken)
            .ContinueWith(t => (IReadOnlyList<PromoAd>)t.Result, cancellationToken);
    }

    public Task<IReadOnlyList<PromoAd>> GetActiveAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        return _context.PromoAds
            .AsNoTracking()
            .Where(a => a.IsActive
                && (!a.StartDate.HasValue || a.StartDate <= now)
                && (!a.EndDate.HasValue || a.EndDate >= now))
            .OrderBy(a => a.SortOrder)
            .ThenByDescending(a => a.Id)
            .ToListAsync(cancellationToken)
            .ContinueWith(t => (IReadOnlyList<PromoAd>)t.Result, cancellationToken);
    }

    public Task<PromoAd?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return _context.PromoAds.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public async Task<PromoAd> CreateAsync(PromoAd ad, CancellationToken cancellationToken = default)
    {
        _context.PromoAds.Add(ad);
        await _context.SaveChangesAsync(cancellationToken);
        return ad;
    }

    public async Task UpdateAsync(PromoAd ad, CancellationToken cancellationToken = default)
    {
        _context.PromoAds.Update(ad);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var ad = await _context.PromoAds.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (ad is null) return;
        _context.PromoAds.Remove(ad);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
