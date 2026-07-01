using EcommerceWeb.Application.Dtos;

namespace EcommerceWeb.Application.Interfaces;

public interface IFavoriteService
{
    Task<FavoritesSummaryDto> GetFavoritesAsync(string userId, CancellationToken cancellationToken = default);

    Task<FavoritesSummaryDto> ToggleAsync(ToggleFavoriteDto dto, CancellationToken cancellationToken = default);
}
