using EcommerceWeb.Application.Dtos;

namespace EcommerceWeb.Application.Interfaces;

public interface ISettingsService
{
    Task<SettingsDto> GetAsync(CancellationToken cancellationToken = default);

    Task<SettingsDto> UpdateAsync(SaveSettingsDto dto, CancellationToken cancellationToken = default);
}
