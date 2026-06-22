using Microsoft.AspNetCore.Identity;

namespace Single_Vendor.Web.Services;

public interface ICustomerJwtIssuer
{
    Task<string> IssueAsync(IdentityUser user, CancellationToken cancellationToken = default);
}
