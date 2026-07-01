using EcommerceWeb.Core.Entities;

namespace EcommerceWeb.Core.Interfaces;

public interface IPasswordVerifier
{
    string HashPassword(AspNetUser user, string password);

    bool Verify(AspNetUser user, string password);
}
