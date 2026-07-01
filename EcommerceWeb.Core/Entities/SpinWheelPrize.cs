using System;
using System.Collections.Generic;

namespace EcommerceWeb.Core.Entities;

public partial class SpinWheelPrize
{
    public int Id { get; set; }

    public string Label { get; set; } = null!;

    public decimal? DiscountPercent { get; set; }

    public decimal? DiscountAmount { get; set; }

    public int Weight { get; set; }

    public string? Color { get; set; }

    public bool IsActive { get; set; }

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    public virtual ICollection<UserSpinWheelResult> UserSpinWheelResults { get; set; } = new List<UserSpinWheelResult>();
}
