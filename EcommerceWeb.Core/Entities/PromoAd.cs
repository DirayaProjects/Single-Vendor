using System;
using System.Collections.Generic;

namespace EcommerceWeb.Core.Entities;

public partial class PromoAd
{
    public int Id { get; set; }

    public string Title { get; set; } = null!;

    public string? Subtitle { get; set; }

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    public string? LinkUrl { get; set; }

    public string? ButtonText { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public bool IsActive { get; set; }

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}
