using EcommerceWeb.Core.Entities;

namespace EcommerceWeb.Core.Interfaces;

public interface ISettingsRepository
{
    Task<WebsiteSetting?> GetAsync(CancellationToken cancellationToken = default);

    Task<WebsiteSetting> UpsertAsync(WebsiteSetting settings, CancellationToken cancellationToken = default);
}
