using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Interfaces;
using EcommerceWeb.Core.Interfaces;

namespace EcommerceWeb.Application.Services;

public class FavoriteService : IFavoriteService
{
    private readonly IFavoriteRepository _favoriteRepository;
    private readonly IAuthRepository _authRepository;
    private readonly IProductRepository _productRepository;

    public FavoriteService(
        IFavoriteRepository favoriteRepository,
        IAuthRepository authRepository,
        IProductRepository productRepository)
    {
        _favoriteRepository = favoriteRepository;
        _authRepository = authRepository;
        _productRepository = productRepository;
    }

    public async Task<FavoritesSummaryDto> GetFavoritesAsync(string userId, CancellationToken cancellationToken = default)
    {
        await EnsureUserExists(userId, cancellationToken);
        var favorites = await _favoriteRepository.GetByUserIdAsync(userId, cancellationToken);
        return MapSummary(favorites);
    }

    public async Task<FavoritesSummaryDto> ToggleAsync(ToggleFavoriteDto dto, CancellationToken cancellationToken = default)
    {
        await EnsureUserExists(dto.UserId, cancellationToken);

        var product = await _productRepository.GetByIdWithDetailsAsync(dto.ProductId, cancellationToken);
        if (product is null || !product.IsActive)
        {
            throw new InvalidOperationException("Product not found.");
        }

        var exists = await _favoriteRepository.ExistsAsync(dto.UserId, dto.ProductId, cancellationToken);
        if (exists)
        {
            await _favoriteRepository.RemoveAsync(dto.UserId, dto.ProductId, cancellationToken);
        }
        else
        {
            await _favoriteRepository.AddAsync(dto.UserId, dto.ProductId, cancellationToken);
        }

        var favorites = await _favoriteRepository.GetByUserIdAsync(dto.UserId, cancellationToken);
        return MapSummary(favorites);
    }

    private async Task EnsureUserExists(string userId, CancellationToken cancellationToken)
    {
        var user = await _authRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            throw new InvalidOperationException("User not found.");
        }
    }

    private static FavoritesSummaryDto MapSummary(IReadOnlyList<Core.Entities.Favorite> favorites)
    {
        var items = favorites.Select(f => new FavoriteItemDto
        {
            ProductId = f.ProductId,
            Name = f.Product.Name,
            Details = f.Product.Details,
            Price = f.Product.Price,
            Rating = f.Product.Rating,
            Image = f.Product.ProductImages
                .OrderBy(i => i.SortOrder)
                .Select(i => i.ImageUrl)
                .FirstOrDefault()
        }).ToList();

        return new FavoritesSummaryDto
        {
            Items = items,
            ProductIds = items.Select(i => i.ProductId).ToList(),
            Count = items.Count
        };
    }
}
