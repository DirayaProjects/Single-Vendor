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

    public Task<bool> ExistsByEmailOrUsernameAsync(string email, string username, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.ToUpperInvariant();
        var normalizedUsername = username.ToUpperInvariant();

        return _context.AspNetUsers.AnyAsync(
            u => u.NormalizedEmail == normalizedEmail || u.NormalizedUserName == normalizedUsername,
            cancellationToken);
    }

    public async Task<AspNetUser> CreateAsync(AspNetUser user, CancellationToken cancellationToken = default)
    {
        _context.AspNetUsers.Add(user);
        await _context.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task AssignRoleAsync(string userId, string roleName, CancellationToken cancellationToken = default)
    {
        var user = await _context.AspNetUsers
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null)
        {
            throw new InvalidOperationException("User not found.");
        }

        var normalizedRole = roleName.ToUpperInvariant();
        var role = await _context.AspNetRoles
            .FirstOrDefaultAsync(r => r.NormalizedName == normalizedRole, cancellationToken);

        if (role is null)
        {
            throw new InvalidOperationException($"Role '{roleName}' not found.");
        }

        if (user.Roles.Any(r => r.Id == role.Id))
        {
            return;
        }

        user.Roles.Add(role);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
