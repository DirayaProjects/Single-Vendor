using EcommerceWeb.Core.Entities;

namespace EcommerceWeb.Core.Interfaces;

public interface IOrderRepository
{
    Task<IReadOnlyList<Order>> GetAllWithUserAsync(CancellationToken cancellationToken = default);

    Task<Order?> GetByIdWithUserAsync(int id, CancellationToken cancellationToken = default);

    Task<string?> FindUserIdByCustomerNameAsync(string customer, CancellationToken cancellationToken = default);

    Task<Order> CreateAsync(Order order, CancellationToken cancellationToken = default);

    Task UpdateAsync(Order order, CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
