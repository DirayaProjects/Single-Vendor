using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Interfaces;
using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;

namespace EcommerceWeb.Application.Services;

public class OrderService : IOrderService
{
    private readonly IOrderRepository _orderRepository;

    public OrderService(IOrderRepository orderRepository)
    {
        _orderRepository = orderRepository;
    }

    public async Task<IReadOnlyList<OrderDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var orders = await _orderRepository.GetAllWithUserAsync(cancellationToken);
        return orders.Select(MapToDto).ToList();
    }

    public async Task<OrderDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var order = await _orderRepository.GetByIdWithUserAsync(id, cancellationToken);
        return order is null ? null : MapToDto(order);
    }

    public async Task<OrderDto> CreateAsync(SaveOrderDto dto, CancellationToken cancellationToken = default)
    {
        var userId = await _orderRepository.FindUserIdByCustomerNameAsync(dto.Customer.Trim(), cancellationToken);
        if (userId is null)
        {
            throw new InvalidOperationException("Customer not found.");
        }

        var order = BuildOrder(userId, dto);
        var created = await _orderRepository.CreateAsync(order, cancellationToken);
        var loaded = await _orderRepository.GetByIdWithUserAsync(created.Id, cancellationToken);
        return MapToDto(loaded!);
    }

    public async Task<OrderDto?> UpdateAsync(int id, SaveOrderDto dto, CancellationToken cancellationToken = default)
    {
        var order = await _orderRepository.GetByIdWithUserAsync(id, cancellationToken);
        if (order is null)
        {
            return null;
        }

        var userId = await _orderRepository.FindUserIdByCustomerNameAsync(dto.Customer.Trim(), cancellationToken);
        if (userId is not null)
        {
            order.UserId = userId;
        }

        order.Status = dto.Status;
        order.Total = dto.Total;
        order.SubTotal = dto.Total;
        order.Discount = 0;
        order.DeliveryFee = 0;
        order.Description = dto.Description;
        order.OrderDate = DateTime.Parse(dto.Date).Date;

        await _orderRepository.UpdateAsync(order, cancellationToken);

        var loaded = await _orderRepository.GetByIdWithUserAsync(id, cancellationToken);
        return loaded is null ? null : MapToDto(loaded);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var order = await _orderRepository.GetByIdWithUserAsync(id, cancellationToken);
        if (order is null)
        {
            return false;
        }

        await _orderRepository.DeleteAsync(id, cancellationToken);
        return true;
    }

    private static Order BuildOrder(string userId, SaveOrderDto dto)
    {
        return new Order
        {
            UserId = userId,
            Status = dto.Status,
            SubTotal = dto.Total,
            Discount = 0,
            DeliveryFee = 0,
            Total = dto.Total,
            Description = dto.Description,
            OrderDate = DateTime.Parse(dto.Date).Date
        };
    }

    private static OrderDto MapToDto(Order order)
    {
        return new OrderDto
        {
            Id = order.Id,
            Customer = GetCustomerName(order),
            Total = order.Total,
            Status = order.Status,
            Date = order.OrderDate.ToString("yyyy-MM-dd"),
            Description = order.Description
        };
    }

    private static string GetCustomerName(Order order)
    {
        return order.User?.UserProfile?.FullName
            ?? order.User?.UserName
            ?? order.User?.Email
            ?? "Unknown";
    }
}
