using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace EcommerceWeb.Infrastructure.Services;

public class PasswordVerifier : IPasswordVerifier
{
    private readonly PasswordHasher<AspNetUser> _passwordHasher = new();

    public bool Verify(AspNetUser user, string password)
    {
        if (string.IsNullOrEmpty(user.PasswordHash))
        {
            return false;
        }

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
        return result != PasswordVerificationResult.Failed;
    }

    public string HashPassword(AspNetUser user, string password)
    {
        return _passwordHasher.HashPassword(user, password);
    }
}
