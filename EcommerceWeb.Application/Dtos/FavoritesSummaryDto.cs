namespace EcommerceWeb.Application.Dtos;

public class FavoritesSummaryDto
{
    public IReadOnlyList<FavoriteItemDto> Items { get; set; } = Array.Empty<FavoriteItemDto>();

    public IReadOnlyList<int> ProductIds { get; set; } = Array.Empty<int>();

    public int Count { get; set; }
}
