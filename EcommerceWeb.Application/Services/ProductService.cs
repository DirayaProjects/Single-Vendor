using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Interfaces;
using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;

namespace EcommerceWeb.Application.Services;

public class ProductService : IProductService
{
    private const int MaxImageUrlLength = 1000;

    private readonly IProductRepository _productRepository;
    private readonly IAttributeRepository _attributeRepository;
    private readonly ICategoryRepository _categoryRepository;

    public ProductService(
        IProductRepository productRepository,
        IAttributeRepository attributeRepository,
        ICategoryRepository categoryRepository)
    {
        _productRepository = productRepository;
        _attributeRepository = attributeRepository;
        _categoryRepository = categoryRepository;
    }

    public async Task<IReadOnlyList<ProductDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var products = await _productRepository.GetAllWithDetailsAsync(cancellationToken);
        return products.Select(MapToDto).ToList();
    }

    public async Task<ProductDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var product = await _productRepository.GetByIdWithDetailsAsync(id, cancellationToken);
        return product is null ? null : MapToDto(product);
    }

    public async Task<ProductDto> CreateAsync(SaveProductDto dto, CancellationToken cancellationToken = default)
    {
        await EnsureCategoryExists(dto.CategoryId, cancellationToken);

        var product = new Product
        {
            Name = dto.Name.Trim(),
            Details = dto.Details,
            CategoryId = dto.CategoryId,
            Brand = dto.Brand,
            Price = dto.Price,
            SalePrice = NormalizeSalePrice(dto.SalePrice, dto.Price),
            Quantity = dto.Quantity,
            Rating = 0,
            FavoriteCount = 0,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var attributeValueIds = await ResolveAttributeValueIdsAsync(dto.Attributes, cancellationToken);
        var imageUrls = NormalizeImages(dto.Images);

        var created = await _productRepository.CreateAsync(product, imageUrls, attributeValueIds, cancellationToken);
        var loaded = await _productRepository.GetByIdWithDetailsAsync(created.Id, cancellationToken);
        return MapToDto(loaded!);
    }

    public async Task<ProductDto?> UpdateAsync(int id, SaveProductDto dto, CancellationToken cancellationToken = default)
    {
        var product = await _productRepository.GetByIdWithDetailsAsync(id, cancellationToken);
        if (product is null)
        {
            return null;
        }

        await EnsureCategoryExists(dto.CategoryId, cancellationToken);

        product.Name = dto.Name.Trim();
        product.Details = dto.Details;
        product.CategoryId = dto.CategoryId;
        product.Brand = dto.Brand;
        product.Price = dto.Price;
        product.SalePrice = NormalizeSalePrice(dto.SalePrice, dto.Price);
        product.Quantity = dto.Quantity;
        product.UpdatedAt = DateTime.UtcNow;

        var attributeValueIds = await ResolveAttributeValueIdsAsync(dto.Attributes, cancellationToken);
        var imageUrls = NormalizeImages(dto.Images);

        await _productRepository.UpdateAsync(product, imageUrls, attributeValueIds, cancellationToken);

        var loaded = await _productRepository.GetByIdWithDetailsAsync(id, cancellationToken);
        return loaded is null ? null : MapToDto(loaded);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var product = await _productRepository.GetByIdWithDetailsAsync(id, cancellationToken);
        if (product is null)
        {
            return false;
        }

        await _productRepository.DeleteAsync(id, cancellationToken);
        return true;
    }

    private async Task EnsureCategoryExists(int categoryId, CancellationToken cancellationToken)
    {
        var category = await _categoryRepository.GetByIdAsync(categoryId, cancellationToken);
        if (category is null)
        {
            throw new InvalidOperationException("Category not found.");
        }
    }

    private async Task<List<int>> ResolveAttributeValueIdsAsync(
        Dictionary<string, List<string>> attributes,
        CancellationToken cancellationToken)
    {
        var ids = new List<int>();

        foreach (var (attributeName, rawValues) in attributes)
        {
            if (string.IsNullOrWhiteSpace(attributeName) || rawValues is null)
            {
                continue;
            }

            var attribute = await _attributeRepository.GetByNameAsync(attributeName.Trim(), cancellationToken);
            if (attribute is null)
            {
                continue;
            }

            foreach (var rawValue in rawValues)
            {
                var value = rawValue?.Trim();
                if (string.IsNullOrWhiteSpace(value))
                {
                    continue;
                }

                var attributeValue = await _attributeRepository.FindValueAsync(attribute.Id, value, cancellationToken);
                attributeValue ??= await _attributeRepository.AddValueAsync(attribute.Id, value, cancellationToken);
                ids.Add(attributeValue.Id);
            }
        }

        return ids;
    }

    private static ProductDto MapToDto(Product product)
    {
        return new ProductDto
        {
            Id = product.Id,
            Name = product.Name,
            Details = product.Details,
            CategoryId = product.CategoryId,
            Category = product.Category?.Name ?? string.Empty,
            Brand = product.Brand,
            Price = product.Price,
            SalePrice = product.SalePrice,
            Quantity = product.Quantity,
            Rating = product.Rating,
            Favorites = product.FavoriteCount,
            Images = product.ProductImages
                .OrderBy(i => i.SortOrder)
                .Select(i => i.ImageUrl)
                .ToList(),
            Attributes = product.AttributeValues
                .Where(v => v.Attribute is not null)
                .GroupBy(v => v.Attribute!.Name)
                .ToDictionary(g => g.Key, g => g.Select(v => v.Value).Distinct().ToList())
        };
    }

    private static decimal? NormalizeSalePrice(decimal? salePrice, decimal price)
    {
        if (salePrice is null or <= 0 || salePrice >= price)
        {
            return null;
        }

        return salePrice;
    }

    private static List<string> NormalizeImages(IEnumerable<string> images)
    {
        return images
            .Where(i => !string.IsNullOrWhiteSpace(i) && IsAllowedImageReference(i))
            .Take(4)
            .ToList();
    }

    private static bool IsAllowedImageReference(string image)
    {
        if (image.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
        {
            return image.Length <= MaxImageUrlLength;
        }

        return image.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            || image.StartsWith("https://", StringComparison.OrdinalIgnoreCase);
    }
}

