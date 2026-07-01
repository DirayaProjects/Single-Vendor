using EcommerceWeb.Application.Dtos;

namespace EcommerceWeb.Application.Interfaces;

public interface ICustomerOrderService
{
    Task<IReadOnlyList<CustomerOrderDto>> GetMyOrdersAsync(string userId, CancellationToken cancellationToken = default);

    Task<CustomerOrderDto?> GetMyOrderByIdAsync(int id, string userId, CancellationToken cancellationToken = default);
}
