using EcommerceWeb.Application.Dtos;
using EcommerceWeb.Application.Interfaces;
using EcommerceWeb.Core.Entities;
using EcommerceWeb.Core.Interfaces;

namespace EcommerceWeb.Application.Services;

public class SpinWheelService : ISpinWheelService
{
    private readonly ISpinWheelRepository _spinWheelRepository;
    private readonly ISettingsRepository _settingsRepository;
    private readonly IUserProfileRepository _userProfileRepository;

    public SpinWheelService(
        ISpinWheelRepository spinWheelRepository,
        ISettingsRepository settingsRepository,
        IUserProfileRepository userProfileRepository)
    {
        _spinWheelRepository = spinWheelRepository;
        _settingsRepository = settingsRepository;
        _userProfileRepository = userProfileRepository;
    }

    public async Task<IReadOnlyList<SpinWheelPrizeDto>> GetAllPrizesAsync(CancellationToken cancellationToken = default)
    {
        var prizes = await _spinWheelRepository.GetAllPrizesAsync(cancellationToken);
        return prizes.Select(MapPrize).ToList();
    }

    public async Task<SpinWheelPrizeDto> CreatePrizeAsync(SaveSpinWheelPrizeDto dto, CancellationToken cancellationToken = default)
    {
        NormalizePrizeDto(dto);
        ValidatePrizeDto(dto);
        var prize = BuildPrize(dto);
        prize.CreatedAt = DateTime.UtcNow;
        var created = await _spinWheelRepository.CreatePrizeAsync(prize, cancellationToken);
        return MapPrize(created);
    }

    public async Task<SpinWheelPrizeDto?> UpdatePrizeAsync(int id, SaveSpinWheelPrizeDto dto, CancellationToken cancellationToken = default)
    {
        NormalizePrizeDto(dto);
        ValidatePrizeDto(dto);
        var prize = await _spinWheelRepository.GetPrizeByIdAsync(id, cancellationToken);
        if (prize is null) return null;

        prize.Label = dto.Label.Trim();
        prize.DiscountPercent = dto.DiscountPercent;
        prize.DiscountAmount = dto.DiscountAmount;
        prize.Weight = dto.Weight;
        prize.Color = dto.Color;
        prize.IsActive = dto.IsActive;
        prize.SortOrder = dto.SortOrder;
        prize.UpdatedAt = DateTime.UtcNow;

        await _spinWheelRepository.UpdatePrizeAsync(prize, cancellationToken);
        return MapPrize(prize);
    }

    public async Task<bool> DeletePrizeAsync(int id, CancellationToken cancellationToken = default)
    {
        var prize = await _spinWheelRepository.GetPrizeByIdAsync(id, cancellationToken);
        if (prize is null) return false;
        await _spinWheelRepository.DeletePrizeAsync(id, cancellationToken);
        return true;
    }

    public async Task<SpinWheelStatusDto> GetStatusAsync(string userId, CancellationToken cancellationToken = default)
    {
        var settings = await _settingsRepository.GetAsync(cancellationToken);
        var profile = await _userProfileRepository.GetByUserIdAsync(userId, cancellationToken);
        var prizes = await _spinWheelRepository.GetActivePrizesAsync(cancellationToken);
        var unused = await _spinWheelRepository.GetUnusedResultAsync(userId, cancellationToken);

        var enabled = settings?.SpinWheelEnabled ?? false;
        var visible = settings?.SpinWheelVisible ?? false;

        return new SpinWheelStatusDto
        {
            Enabled = enabled,
            Visible = visible && enabled,
            CanSpin = enabled && visible && profile?.HasSpunWheel != true && unused is null && prizes.Count > 0,
            HasUnusedPrize = unused is not null,
            UnusedPrize = unused?.SpinWheelPrize is null ? null : MapPrize(unused.SpinWheelPrize),
            Prizes = prizes.Select(MapPrize).ToList()
        };
    }

    public async Task<SpinWheelResultDto> SpinAsync(string userId, CancellationToken cancellationToken = default)
    {
        var status = await GetStatusAsync(userId, cancellationToken);
        if (!status.CanSpin)
        {
            throw new InvalidOperationException("Spin wheel is not available.");
        }

        var prizes = await _spinWheelRepository.GetActivePrizesAsync(cancellationToken);
        var prize = PickWeightedPrize(prizes);

        var result = await _spinWheelRepository.CreateResultAsync(new UserSpinWheelResult
        {
            UserId = userId,
            SpinWheelPrizeId = prize.Id,
            WonAt = DateTime.UtcNow,
            IsUsed = false
        }, cancellationToken);

        await _userProfileRepository.MarkHasSpunWheelAsync(userId, cancellationToken);

        return new SpinWheelResultDto
        {
            ResultId = result.Id,
            Prize = MapPrize(prize)
        };
    }

    private static SpinWheelPrize PickWeightedPrize(IReadOnlyList<SpinWheelPrize> prizes)
    {
        var total = prizes.Sum(p => p.Weight);
        var roll = Random.Shared.Next(1, total + 1);
        var cumulative = 0;

        foreach (var prize in prizes)
        {
            cumulative += prize.Weight;
            if (roll <= cumulative)
            {
                return prize;
            }
        }

        return prizes[^1];
    }

    private static void ValidatePrizeDto(SaveSpinWheelPrizeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Label))
        {
            throw new InvalidOperationException("Prize label is required.");
        }

        if (dto.Weight <= 0)
        {
            throw new InvalidOperationException("Prize weight must be positive.");
        }
    }

    private static void NormalizePrizeDto(SaveSpinWheelPrizeDto dto)
    {
        if (!dto.DiscountPercent.HasValue && !dto.DiscountAmount.HasValue)
        {
            dto.DiscountPercent = 0;
        }

        if (dto.DiscountPercent is < 0)
        {
            dto.DiscountPercent = null;
        }

        if (dto.DiscountAmount is < 0)
        {
            dto.DiscountAmount = null;
        }

        if (dto.DiscountPercent is null && dto.DiscountAmount is null)
        {
            dto.DiscountPercent = 0;
        }

        if (string.IsNullOrWhiteSpace(dto.Color))
        {
            dto.Color = "#0f223d";
        }
        else if (dto.Color.Length > 20)
        {
            dto.Color = dto.Color[..20];
        }
    }

    private static SpinWheelPrize BuildPrize(SaveSpinWheelPrizeDto dto) => new()
    {
        Label = dto.Label.Trim(),
        DiscountPercent = dto.DiscountPercent,
        DiscountAmount = dto.DiscountAmount,
        Weight = dto.Weight,
        Color = dto.Color,
        IsActive = dto.IsActive,
        SortOrder = dto.SortOrder
    };

    internal static SpinWheelPrizeDto MapPrize(SpinWheelPrize prize) => new()
    {
        Id = prize.Id,
        Label = prize.Label,
        DiscountPercent = prize.DiscountPercent,
        DiscountAmount = prize.DiscountAmount,
        Weight = prize.Weight,
        Color = prize.Color,
        IsActive = prize.IsActive,
        SortOrder = prize.SortOrder
    };
}
