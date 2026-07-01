using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;
using EcommerceWeb.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EcommerceWeb.Infrastructure.Repositories;

public class UserProfileRepository : IUserProfileRepository
{
    private readonly EcommerceWebDbContext _context;

    public UserProfileRepository(EcommerceWebDbContext context)
    {
        _context = context;
    }

    public Task<UserProfile?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return _context.UserProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
    }

    public async Task<UserProfile> EnsureExistsAsync(
        string userId,
        string? fullName = null,
        CancellationToken cancellationToken = default)
    {
        var profile = await _context.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        if (profile is not null)
        {
            return profile;
        }

        profile = new UserProfile
        {
            UserId = userId,
            FullName = fullName,
            CreatedAt = DateTime.UtcNow
        };

        _context.UserProfiles.Add(profile);
        await _context.SaveChangesAsync(cancellationToken);
        return profile;
    }

    public async Task MarkFirstOrderDiscountUsedAsync(string userId, CancellationToken cancellationToken = default)
    {
        var profile = await EnsureExistsAsync(userId, cancellationToken: cancellationToken);
        profile.FirstOrderDiscountUsed = true;
        profile.FirstOrderDiscountUsedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task MarkHasSpunWheelAsync(string userId, CancellationToken cancellationToken = default)
    {
        var profile = await EnsureExistsAsync(userId, cancellationToken: cancellationToken);
        profile.HasSpunWheel = true;
        await _context.SaveChangesAsync(cancellationToken);
    }

    public Task<bool> HasPlacedOrderAsync(string userId, CancellationToken cancellationToken = default)
    {
        return _context.Orders.AnyAsync(o => o.UserId == userId, cancellationToken);
    }
}
