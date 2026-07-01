using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;
using EcommerceWeb.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EcommerceWeb.Infrastructure.Repositories;

public class SpinWheelRepository : ISpinWheelRepository
{
    private readonly EcommerceWebDbContext _context;

    public SpinWheelRepository(EcommerceWebDbContext context)
    {
        _context = context;
    }

    public Task<IReadOnlyList<SpinWheelPrize>> GetAllPrizesAsync(CancellationToken cancellationToken = default)
    {
        return _context.SpinWheelPrizes
            .AsNoTracking()
            .OrderBy(p => p.SortOrder)
            .ThenBy(p => p.Id)
            .ToListAsync(cancellationToken)
            .ContinueWith(t => (IReadOnlyList<SpinWheelPrize>)t.Result, cancellationToken);
    }

    public Task<IReadOnlyList<SpinWheelPrize>> GetActivePrizesAsync(CancellationToken cancellationToken = default)
    {
        return _context.SpinWheelPrizes
            .AsNoTracking()
            .Where(p => p.IsActive)
            .OrderBy(p => p.SortOrder)
            .ThenBy(p => p.Id)
            .ToListAsync(cancellationToken)
            .ContinueWith(t => (IReadOnlyList<SpinWheelPrize>)t.Result, cancellationToken);
    }

    public Task<SpinWheelPrize?> GetPrizeByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return _context.SpinWheelPrizes.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<SpinWheelPrize> CreatePrizeAsync(SpinWheelPrize prize, CancellationToken cancellationToken = default)
    {
        _context.SpinWheelPrizes.Add(prize);
        await _context.SaveChangesAsync(cancellationToken);
        return prize;
    }

    public async Task UpdatePrizeAsync(SpinWheelPrize prize, CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeletePrizeAsync(int id, CancellationToken cancellationToken = default)
    {
        var prize = await _context.SpinWheelPrizes.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (prize is null) return;

        var results = await _context.UserSpinWheelResults
            .Where(r => r.SpinWheelPrizeId == id)
            .ToListAsync(cancellationToken);
        if (results.Count > 0)
        {
            _context.UserSpinWheelResults.RemoveRange(results);
        }

        var orders = await _context.Orders
            .Where(o => o.SpinWheelPrizeId == id)
            .ToListAsync(cancellationToken);
        foreach (var order in orders)
        {
            order.SpinWheelPrizeId = null;
        }

        _context.SpinWheelPrizes.Remove(prize);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public Task<UserSpinWheelResult?> GetUnusedResultAsync(string userId, CancellationToken cancellationToken = default)
    {
        return _context.UserSpinWheelResults
            .AsNoTracking()
            .Include(r => r.SpinWheelPrize)
            .Where(r => r.UserId == userId && !r.IsUsed)
            .OrderByDescending(r => r.WonAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<UserSpinWheelResult> CreateResultAsync(UserSpinWheelResult result, CancellationToken cancellationToken = default)
    {
        _context.UserSpinWheelResults.Add(result);
        await _context.SaveChangesAsync(cancellationToken);
        return result;
    }

    public async Task MarkResultUsedAsync(int resultId, int orderId, CancellationToken cancellationToken = default)
    {
        var result = await _context.UserSpinWheelResults.FirstOrDefaultAsync(r => r.Id == resultId, cancellationToken);
        if (result is null) return;
        result.IsUsed = true;
        result.UsedOnOrderId = orderId;
        await _context.SaveChangesAsync(cancellationToken);
    }
}
