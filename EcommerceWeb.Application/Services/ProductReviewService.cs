using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Helpers;
using EcommerceWeb.Application.Interfaces;
using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;

namespace EcommerceWeb.Application.Services;

public class ProductReviewService : IProductReviewService
{
    private readonly IProductReviewRepository _productReviewRepository;
    private readonly IAuthRepository _authRepository;
    private readonly IProductRepository _productRepository;

    public ProductReviewService(
        IProductReviewRepository productReviewRepository,
        IAuthRepository authRepository,
        IProductRepository productRepository)
    {
        _productReviewRepository = productReviewRepository;
        _authRepository = authRepository;
        _productRepository = productRepository;
    }

    public async Task<IReadOnlyList<ProductReviewDto>> GetReviewsAsync(int productId, CancellationToken cancellationToken = default)
    {
        var reviews = await _productReviewRepository.GetByProductIdAsync(productId, cancellationToken);
        return reviews.Select(MapToDto).ToList();
    }

    public async Task<ProductReviewDto?> GetUserReviewAsync(string userId, int productId, CancellationToken cancellationToken = default)
    {
        var user = await _authRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            return null;
        }

        var review = await _productReviewRepository.GetUserReviewForProductAsync(userId, productId, cancellationToken);
        return review is null ? null : MapToDto(review);
    }

    public async Task<ProductReviewDto> SubmitReviewAsync(int productId, SubmitProductReviewDto dto, CancellationToken cancellationToken = default)
    {
        var user = await _authRepository.GetByIdAsync(dto.UserId, cancellationToken);
        if (user is null)
        {
            throw new InvalidOperationException("User not found. Please log in.");
        }

        var roles = await _authRepository.GetUserRolesAsync(dto.UserId, cancellationToken);
        if (roles.Any(r => string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase)))
        {
            throw new InvalidOperationException("Admins cannot submit product reviews.");
        }

        var product = await _productRepository.GetByIdWithDetailsAsync(productId, cancellationToken);
        if (product is null || !product.IsActive)
        {
            throw new InvalidOperationException("Product not found.");
        }

        if (dto.Rating < 1 || dto.Rating > 5)
        {
            throw new InvalidOperationException("Rating must be between 1 and 5.");
        }

        if (string.IsNullOrWhiteSpace(dto.Comment))
        {
            throw new InvalidOperationException("Review comment is required.");
        }

        var username = user.UserName ?? user.Email ?? "Customer";
        var existing = await _productReviewRepository.GetUserReviewForProductAsync(dto.UserId, productId, cancellationToken);

        Testimonial saved;
        if (existing is not null)
        {
            existing.Rating = dto.Rating;
            existing.Comment = ProductReviewHelper.BuildComment(productId, dto.Comment);
            existing.Username = username;
            await _productReviewRepository.UpdateAsync(existing, cancellationToken);
            saved = existing;
        }
        else
        {
            saved = await _productReviewRepository.CreateAsync(new Testimonial
            {
                Username = username,
                Rating = dto.Rating,
                Comment = ProductReviewHelper.BuildComment(productId, dto.Comment),
                IsActive = true,
                SortOrder = productId
            }, cancellationToken);
        }

        var average = await _productReviewRepository.GetAverageRatingForProductAsync(productId, cancellationToken);
        await _productReviewRepository.UpdateProductRatingAsync(productId, average, cancellationToken);

        return MapToDto(saved);
    }

    private static ProductReviewDto MapToDto(Testimonial review)
    {
        return new ProductReviewDto
        {
            Id = review.Id,
            Username = review.Username,
            Rating = review.Rating,
            Comment = ProductReviewHelper.GetDisplayComment(review.Comment),
            Image = review.ImageUrl
        };
    }
}
