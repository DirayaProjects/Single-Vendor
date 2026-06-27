using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Interfaces;
using EcommerceWeb.Core.Interfaces;

namespace EcommerceWeb.Application.Services;

public class AuthService : IAuthService
{
    private readonly IAuthRepository _authRepository;
    private readonly IPasswordVerifier _passwordVerifier;

    public AuthService(IAuthRepository authRepository, IPasswordVerifier passwordVerifier)
    {
        _authRepository = authRepository;
        _passwordVerifier = passwordVerifier;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.EmailOrUsername) || string.IsNullOrWhiteSpace(request.Password))
        {
            return new LoginResponseDto
            {
                Success = false,
                Message = "Email/username and password are required."
            };
        }

        var user = await _authRepository.GetByEmailOrUsernameAsync(request.EmailOrUsername.Trim(), cancellationToken);

        if (user is null || !_passwordVerifier.Verify(user, request.Password))
        {
            return new LoginResponseDto
            {
                Success = false,
                Message = "Invalid email/username or password."
            };
        }

        var roles = await _authRepository.GetUserRolesAsync(user.Id, cancellationToken);
        var isAdmin = roles.Any(r => string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase));

        return new LoginResponseDto
        {
            Success = true,
            UserId = user.Id,
            Email = user.Email,
            UserName = user.UserName,
            Roles = roles,
            IsAdmin = isAdmin,
            RedirectUrl = isAdmin ? "/admin/dashboard" : "/home"
        };
    }
}
