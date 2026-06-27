using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;
using EcommerceWeb.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EcommerceWeb.Infrastructure.Repositories;

public class AuthRepository : IAuthRepository
{
    private readonly EcommerceWebDbContext _context;

    public AuthRepository(EcommerceWebDbContext context)
    {
        _context = context;
    }

    public async Task<AspNetUser?> GetByEmailOrUsernameAsync(string emailOrUsername, CancellationToken cancellationToken = default)
    {
        var normalized = emailOrUsername.ToUpperInvariant();

        return await _context.AspNetUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(
                u => u.NormalizedEmail == normalized
                     || u.NormalizedUserName == normalized
                     || u.Email == emailOrUsername
                     || u.UserName == emailOrUsername,
                cancellationToken);
    }

    public Task<AspNetUser?> GetByIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return _context.AspNetUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
    }

    public async Task<IReadOnlyList<string>> GetUserRolesAsync(string userId, CancellationToken cancellationToken = default)
    {
        var roleNames = await _context.AspNetUsers
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .SelectMany(u => u.Roles)
            .Select(r => r.Name!)
            .ToListAsync(cancellationToken);

        return roleNames;
    }
}
