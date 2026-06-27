using EcommerceWeb.Core.Entities;

namespace EcommerceWeb.Core.Interfaces;

public interface IAttributeRepository
{
    Task<IReadOnlyList<Entities.Attribute>> GetAllWithValuesAsync(CancellationToken cancellationToken = default);

    Task<Entities.Attribute?> GetByIdWithValuesAsync(int id, CancellationToken cancellationToken = default);

    Task<Entities.Attribute?> GetByNameAsync(string name, CancellationToken cancellationToken = default);

    Task<AttributeValue?> FindValueAsync(int attributeId, string value, CancellationToken cancellationToken = default);

    Task<Entities.Attribute> CreateAsync(Entities.Attribute attribute, IEnumerable<string> values, CancellationToken cancellationToken = default);

    Task UpdateAsync(Entities.Attribute attribute, IEnumerable<string> values, CancellationToken cancellationToken = default);

    Task DeleteAsync(int id, CancellationToken cancellationToken = default);

    Task<AttributeValue> AddValueAsync(int attributeId, string value, CancellationToken cancellationToken = default);
}
