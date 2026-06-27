using EcommerceWeb.Application.Dtos;

namespace EcommerceWeb.Application.Interfaces;

public interface ICartService
{
    Task<CartSummaryDto> GetCartAsync(string userId, CancellationToken cancellationToken = default);

    Task<CartSummaryDto> AddItemAsync(AddCartItemDto dto, CancellationToken cancellationToken = default);

    Task<CartSummaryDto?> UpdateItemAsync(int cartItemId, UpdateCartItemDto dto, CancellationToken cancellationToken = default);

    Task<CartSummaryDto?> RemoveItemAsync(int cartItemId, string userId, CancellationToken cancellationToken = default);
}
