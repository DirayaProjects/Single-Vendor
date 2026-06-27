using EcommerceWeb.Core.Entities;

namespace EcommerceWeb.Core.Interfaces;

public interface IPasswordVerifier
{
    bool Verify(AspNetUser user, string password);
}
