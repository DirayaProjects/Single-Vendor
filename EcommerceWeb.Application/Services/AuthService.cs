using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Interfaces;
using EcommerceWeb.Core.Interfaces;

namespace EcommerceWeb.Application.Services;

public class AuthService : IAuthService
{
    private readonly IAuthRepository _authRepository;
    private readonly IPasswordVerifier _passwordVerifier;
    private readonly IUserProfileRepository _userProfileRepository;

    public AuthService(
        IAuthRepository authRepository,
        IPasswordVerifier passwordVerifier,
        IUserProfileRepository userProfileRepository)
    {
        _authRepository = authRepository;
        _passwordVerifier = passwordVerifier;
        _userProfileRepository = userProfileRepository;
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

    public async Task<LoginResponseDto> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default)
    {
        var userName = request.UserName?.Trim() ?? string.Empty;
        var email = request.Email?.Trim() ?? string.Empty;
        var password = request.Password ?? string.Empty;

        if (string.IsNullOrWhiteSpace(userName) || string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            return new LoginResponseDto
            {
                Success = false,
                Message = "Username, email, and password are required."
            };
        }

        if (password.Length < 6)
        {
            return new LoginResponseDto
            {
                Success = false,
                Message = "Password must be at least 6 characters."
            };
        }

        if (await _authRepository.ExistsByEmailOrUsernameAsync(email, userName, cancellationToken))
        {
            return new LoginResponseDto
            {
                Success = false,
                Message = "An account with that email or username already exists."
            };
        }

        var user = new Core.Entities.AspNetUser
        {
            Id = Guid.NewGuid().ToString(),
            UserName = userName,
            NormalizedUserName = userName.ToUpperInvariant(),
            Email = email,
            NormalizedEmail = email.ToUpperInvariant(),
            EmailConfirmed = false,
            SecurityStamp = Guid.NewGuid().ToString(),
            ConcurrencyStamp = Guid.NewGuid().ToString(),
            LockoutEnabled = true
        };

        user.PasswordHash = _passwordVerifier.HashPassword(user, password);

        await _authRepository.CreateAsync(user, cancellationToken);
        await _authRepository.AssignRoleAsync(user.Id, "Customer", cancellationToken);
        await _userProfileRepository.EnsureExistsAsync(user.Id, userName, cancellationToken);

        var roles = await _authRepository.GetUserRolesAsync(user.Id, cancellationToken);

        return new LoginResponseDto
        {
            Success = true,
            UserId = user.Id,
            Email = user.Email,
            UserName = user.UserName,
            Roles = roles,
            IsAdmin = false,
            RedirectUrl = "/home"
        };
    }
}
