using EcommerceWeb.Core.Entities;

namespace EcommerceWeb.Core.Interfaces;

public interface IProductRepository
{
    Task<IReadOnlyList<Product>> GetAllWithDetailsAsync(CancellationToken cancellationToken = default);

    Task<Product?> GetByIdWithDetailsAsync(int id, CancellationToken cancellationToken = default);

    Task<Product> CreateAsync(Product product, IEnumerable<string> imageUrls, IEnumerable<int> attributeValueIds, CancellationToken cancellationToken = default);

    Task UpdateAsync(Product product, IEnumerable<string> imageUrls, IEnumerable<int> attributeValueIds, CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
