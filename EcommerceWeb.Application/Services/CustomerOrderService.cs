using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Interfaces;
using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;

namespace EcommerceWeb.Application.Services;

public class CustomerOrderService : ICustomerOrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly IAuthRepository _authRepository;

    public CustomerOrderService(IOrderRepository orderRepository, IAuthRepository authRepository)
    {
        _orderRepository = orderRepository;
        _authRepository = authRepository;
    }

    public async Task<IReadOnlyList<CustomerOrderDto>> GetMyOrdersAsync(string userId, CancellationToken cancellationToken = default)
    {
        await EnsureUserExists(userId, cancellationToken);
        var orders = await _orderRepository.GetByUserIdAsync(userId, cancellationToken);
        return orders.Select(MapToDto).ToList();
    }

    public async Task<CustomerOrderDto?> GetMyOrderByIdAsync(int id, string userId, CancellationToken cancellationToken = default)
    {
        await EnsureUserExists(userId, cancellationToken);
        var order = await _orderRepository.GetByIdForUserAsync(id, userId, cancellationToken);
        return order is null ? null : MapToDto(order);
    }

    private async Task EnsureUserExists(string userId, CancellationToken cancellationToken)
    {
        var user = await _authRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            throw new InvalidOperationException("User not found.");
        }
    }

    private static CustomerOrderDto MapToDto(Order order)
    {
        return new CustomerOrderDto
        {
            Id = order.Id,
            Status = order.Status,
            SubTotal = order.SubTotal,
            DeliveryFee = order.DeliveryFee,
            Total = order.Total,
            Date = order.OrderDate.ToString("yyyy-MM-dd"),
            Description = order.Description,
            Items = order.OrderItems.Select(i => new CustomerOrderItemDto
            {
                ProductName = i.ProductName,
                UnitPrice = i.UnitPrice,
                Quantity = i.Quantity,
                LineTotal = i.LineTotal
            }).ToList()
        };
    }
}
