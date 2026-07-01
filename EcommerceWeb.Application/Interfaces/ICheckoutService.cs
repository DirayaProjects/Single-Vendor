using EcommerceWeb.Application.Dtos;

namespace EcommerceWeb.Application.Interfaces;

public interface ICheckoutService
{
    Task<CheckoutPreviewDto> PreviewAsync(CheckoutRequestDto dto, CancellationToken cancellationToken = default);

    Task<CheckoutResultDto> CheckoutAsync(CheckoutRequestDto dto, CancellationToken cancellationToken = default);
}
