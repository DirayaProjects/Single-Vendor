using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Interfaces;
using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;

namespace EcommerceWeb.Application.Services;

public class CartService : ICartService
{
    private readonly ICartRepository _cartRepository;
    private readonly IAuthRepository _authRepository;
    private readonly IProductRepository _productRepository;

    public CartService(
        ICartRepository cartRepository,
        IAuthRepository authRepository,
        IProductRepository productRepository)
    {
        _cartRepository = cartRepository;
        _authRepository = authRepository;
        _productRepository = productRepository;
    }

    public async Task<CartSummaryDto> GetCartAsync(string userId, CancellationToken cancellationToken = default)
    {
        await EnsureUserExists(userId, cancellationToken);
        var items = await _cartRepository.GetByUserIdAsync(userId, cancellationToken);
        return MapSummary(items);
    }

    public async Task<CartSummaryDto> AddItemAsync(AddCartItemDto dto, CancellationToken cancellationToken = default)
    {
        await EnsureUserExists(dto.UserId, cancellationToken);

        var product = await _productRepository.GetByIdWithDetailsAsync(dto.ProductId, cancellationToken);
        if (product is null || !product.IsActive)
        {
            throw new InvalidOperationException("Product not found.");
        }

        var quantity = Math.Max(1, dto.Quantity);
        var existing = await _cartRepository.GetByUserAndProductAsync(dto.UserId, dto.ProductId, cancellationToken);

        if (existing is not null)
        {
            existing.Quantity += quantity;
            existing.UpdatedAt = DateTime.UtcNow;
            await _cartRepository.AddOrUpdateAsync(existing, cancellationToken);
        }
        else
        {
            await _cartRepository.AddOrUpdateAsync(new CartItem
            {
                UserId = dto.UserId,
                ProductId = dto.ProductId,
                Quantity = quantity,
                CreatedAt = DateTime.UtcNow
            }, cancellationToken);
        }

        var items = await _cartRepository.GetByUserIdAsync(dto.UserId, cancellationToken);
        return MapSummary(items);
    }

    public async Task<CartSummaryDto?> UpdateItemAsync(int cartItemId, UpdateCartItemDto dto, CancellationToken cancellationToken = default)
    {
        await EnsureUserExists(dto.UserId, cancellationToken);

        var items = await _cartRepository.GetByUserIdAsync(dto.UserId, cancellationToken);
        if (items.All(i => i.Id != cartItemId))
        {
            return null;
        }

        if (dto.Quantity <= 0)
        {
            await _cartRepository.RemoveAsync(cartItemId, cancellationToken);
        }
        else
        {
            await _cartRepository.UpdateQuantityAsync(cartItemId, dto.Quantity, cancellationToken);
        }

        var updated = await _cartRepository.GetByUserIdAsync(dto.UserId, cancellationToken);
        return MapSummary(updated);
    }

    public async Task<CartSummaryDto?> RemoveItemAsync(int cartItemId, string userId, CancellationToken cancellationToken = default)
    {
        await EnsureUserExists(userId, cancellationToken);

        var items = await _cartRepository.GetByUserIdAsync(userId, cancellationToken);
        if (items.All(i => i.Id != cartItemId))
        {
            return null;
        }

        await _cartRepository.RemoveAsync(cartItemId, cancellationToken);
        var updated = await _cartRepository.GetByUserIdAsync(userId, cancellationToken);
        return MapSummary(updated);
    }

    private async Task EnsureUserExists(string userId, CancellationToken cancellationToken)
    {
        var user = await _authRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            throw new InvalidOperationException("User not found.");
        }
    }

    private static CartSummaryDto MapSummary(IReadOnlyList<CartItem> items)
    {
        var mapped = items.Select(item => new CartItemDto
        {
            Id = item.Id,
            ProductId = item.ProductId,
            Name = item.Product.Name,
            Details = item.Product.Details,
            Price = item.Product.Price,
            Quantity = item.Quantity,
            Image = item.Product.ProductImages
                .OrderBy(i => i.SortOrder)
                .Select(i => i.ImageUrl)
                .FirstOrDefault()
        }).ToList();

        return new CartSummaryDto
        {
            Items = mapped,
            Subtotal = mapped.Sum(i => i.Price * i.Quantity),
            ItemCount = mapped.Sum(i => i.Quantity)
        };
    }
}
