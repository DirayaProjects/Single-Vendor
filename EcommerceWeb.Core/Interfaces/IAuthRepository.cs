using EcommerceWeb.Core.Entities;

namespace EcommerceWeb.Core.Interfaces;

public interface IAuthRepository
{
    Task<AspNetUser?> GetByEmailOrUsernameAsync(string emailOrUsername, CancellationToken cancellationToken = default);

    Task<AspNetUser?> GetByIdAsync(string userId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<string>> GetUserRolesAsync(string userId, CancellationToken cancellationToken = default);

    Task<bool> ExistsByEmailOrUsernameAsync(string email, string username, CancellationToken cancellationToken = default);

    Task<AspNetUser> CreateAsync(AspNetUser user, CancellationToken cancellationToken = default);

    Task AssignRoleAsync(string userId, string roleName, CancellationToken cancellationToken = default);
}
