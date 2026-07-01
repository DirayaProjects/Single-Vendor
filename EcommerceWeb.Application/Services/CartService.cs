using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Helpers;
using EcommerceWeb.Application.Interfaces;
using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;

namespace EcommerceWeb.Application.Services;

public class CartService : ICartService
{
    private readonly ICartRepository _cartRepository;
    private readonly IAuthRepository _authRepository;
    private readonly IProductRepository _productRepository;
    private readonly ISettingsRepository _settingsRepository;
    private readonly IGeneralDiscountRepository _generalDiscountRepository;

    public CartService(
        ICartRepository cartRepository,
        IAuthRepository authRepository,
        IProductRepository productRepository,
        ISettingsRepository settingsRepository,
        IGeneralDiscountRepository generalDiscountRepository)
    {
        _cartRepository = cartRepository;
        _authRepository = authRepository;
        _productRepository = productRepository;
        _settingsRepository = settingsRepository;
        _generalDiscountRepository = generalDiscountRepository;
    }

    public async Task<CartSummaryDto> GetCartAsync(string userId, CancellationToken cancellationToken = default)
    {
        await EnsureUserExists(userId, cancellationToken);
        var items = await _cartRepository.GetByUserIdAsync(userId, cancellationToken);
        return await MapSummaryAsync(items, cancellationToken);
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
        CartAttributeHelper.ValidateSelectedAttributes(product, dto.SelectedAttributes);
        var attributesJson = CartAttributeHelper.NormalizeToJson(dto.SelectedAttributes);
        var existing = await _cartRepository.GetByUserProductAndAttributesAsync(dto.UserId, dto.ProductId, attributesJson, cancellationToken);

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
                SelectedAttributes = attributesJson,
                CreatedAt = DateTime.UtcNow
            }, cancellationToken);
        }

        var items = await _cartRepository.GetByUserIdAsync(dto.UserId, cancellationToken);
        return await MapSummaryAsync(items, cancellationToken);
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
        return await MapSummaryAsync(updated, cancellationToken);
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
        return await MapSummaryAsync(updated, cancellationToken);
    }

    private async Task EnsureUserExists(string userId, CancellationToken cancellationToken)
    {
        var user = await _authRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            throw new InvalidOperationException("User not found.");
        }
    }

    private async Task<Dictionary<int, GeneralDiscount>> BuildProductDiscountMapAsync(CancellationToken cancellationToken)
    {
        var settings = await _settingsRepository.GetAsync(cancellationToken);
        if (settings?.GeneralDiscountsEnabled != true)
        {
            return new Dictionary<int, GeneralDiscount>();
        }

        var discounts = await _generalDiscountRepository.GetActiveWithProductsAsync(cancellationToken);
        var map = new Dictionary<int, GeneralDiscount>();

        foreach (var discount in discounts)
        {
            foreach (var product in discount.Products)
            {
                map[product.Id] = discount;
            }
        }

        return map;
    }

    private async Task<CartSummaryDto> MapSummaryAsync(IReadOnlyList<CartItem> items, CancellationToken cancellationToken)
    {
        var discountMap = await BuildProductDiscountMapAsync(cancellationToken);

        var mapped = items.Select(item =>
        {
            discountMap.TryGetValue(item.ProductId, out var generalDiscount);
            var (effective, _) = ProductPricingHelper.GetEffectiveUnitPrice(item.Product, generalDiscount);

            return new CartItemDto
            {
                Id = item.Id,
                ProductId = item.ProductId,
                Name = item.Product.Name,
                Details = item.Product.Details,
                Price = item.Product.Price,
                SalePrice = item.Product.SalePrice,
                EffectivePrice = effective,
                Quantity = item.Quantity,
                Image = item.Product.ProductImages
                    .OrderBy(i => i.SortOrder)
                    .Select(i => i.ImageUrl)
                    .FirstOrDefault(),
                SelectedAttributes = CartAttributeHelper.ParseFromJson(item.SelectedAttributes ?? "{}")
            };
        }).ToList();

        return new CartSummaryDto
        {
            Items = mapped,
            Subtotal = mapped.Sum(i => i.EffectivePrice * i.Quantity),
            OriginalSubtotal = mapped.Sum(i => i.Price * i.Quantity),
            ItemCount = mapped.Sum(i => i.Quantity)
        };
    }
}
