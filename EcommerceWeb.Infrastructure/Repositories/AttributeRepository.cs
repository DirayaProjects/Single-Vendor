using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;
using EcommerceWeb.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using AttributeEntity = EcommerceWeb.Core.Entities.Attribute;

namespace EcommerceWeb.Infrastructure.Repositories;

public class AttributeRepository : IAttributeRepository
{
    private readonly EcommerceWebDbContext _context;

    public AttributeRepository(EcommerceWebDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<AttributeEntity>> GetAllWithValuesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Attributes
            .AsNoTracking()
            .Include(a => a.AttributeValues)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public Task<AttributeEntity?> GetByIdWithValuesAsync(int id, CancellationToken cancellationToken = default)
    {
        return _context.Attributes
            .Include(a => a.AttributeValues)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public Task<AttributeEntity?> GetByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        return _context.Attributes
            .Include(a => a.AttributeValues)
            .FirstOrDefaultAsync(a => a.Name == name, cancellationToken);
    }

    public Task<AttributeValue?> FindValueAsync(int attributeId, string value, CancellationToken cancellationToken = default)
    {
        return _context.AttributeValues
            .FirstOrDefaultAsync(v => v.AttributeId == attributeId && v.Value == value, cancellationToken);
    }

    public async Task<AttributeEntity> CreateAsync(AttributeEntity attribute, IEnumerable<string> values, CancellationToken cancellationToken = default)
    {
        attribute.AttributeValues = values
            .Select(v => new AttributeValue { Value = v })
            .ToList();

        _context.Attributes.Add(attribute);
        await _context.SaveChangesAsync(cancellationToken);
        return attribute;
    }

    public async Task UpdateAsync(AttributeEntity attribute, IEnumerable<string> values, CancellationToken cancellationToken = default)
    {
        var existingValues = await _context.AttributeValues
            .Where(v => v.AttributeId == attribute.Id)
            .ToListAsync(cancellationToken);

        var normalized = values.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var toRemove = existingValues.Where(v => !normalized.Contains(v.Value)).ToList();

        if (toRemove.Count > 0)
        {
            _context.AttributeValues.RemoveRange(toRemove);
        }

        var existingNames = existingValues
            .Where(v => normalized.Contains(v.Value))
            .Select(v => v.Value)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var value in normalized.Where(v => !existingNames.Contains(v)))
        {
            _context.AttributeValues.Add(new AttributeValue
            {
                AttributeId = attribute.Id,
                Value = value
            });
        }

        _context.Attributes.Update(attribute);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var attribute = await _context.Attributes
            .Include(a => a.AttributeValues)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (attribute is null)
        {
            return;
        }

        _context.AttributeValues.RemoveRange(attribute.AttributeValues);
        _context.Attributes.Remove(attribute);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<AttributeValue> AddValueAsync(int attributeId, string value, CancellationToken cancellationToken = default)
    {
        var attributeValue = new AttributeValue
        {
            AttributeId = attributeId,
            Value = value
        };

        _context.AttributeValues.Add(attributeValue);
        await _context.SaveChangesAsync(cancellationToken);
        return attributeValue;
    }
}
