using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;
using EcommerceWeb.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EcommerceWeb.Infrastructure.Repositories;

public class DeliveryCityRepository : IDeliveryCityRepository
{
    private readonly EcommerceWebDbContext _context;

    public DeliveryCityRepository(EcommerceWebDbContext context)
    {
        _context = context;
    }

    public Task<IReadOnlyList<DeliveryCity>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return _context.DeliveryCities
            .AsNoTracking()
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken)
            .ContinueWith(t => (IReadOnlyList<DeliveryCity>)t.Result, cancellationToken);
    }

    public Task<IReadOnlyList<DeliveryCity>> GetActiveAsync(CancellationToken cancellationToken = default)
    {
        return _context.DeliveryCities
            .AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken)
            .ContinueWith(t => (IReadOnlyList<DeliveryCity>)t.Result, cancellationToken);
    }

    public Task<DeliveryCity?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return _context.DeliveryCities.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<DeliveryCity> CreateAsync(DeliveryCity city, CancellationToken cancellationToken = default)
    {
        _context.DeliveryCities.Add(city);
        await _context.SaveChangesAsync(cancellationToken);
        return city;
    }

    public async Task UpdateAsync(DeliveryCity city, CancellationToken cancellationToken = default)
    {
        _context.DeliveryCities.Update(city);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var city = await _context.DeliveryCities.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (city is null) return;
        _context.DeliveryCities.Remove(city);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
