using System;
using System.Collections.Generic;

namespace EcommerceWeb.Core.Entities;

public partial class PromoCode
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public decimal? DiscountAmount { get; set; }

    public decimal? DiscountPercent { get; set; }

    public bool IsActive { get; set; }

    public DateTime? ExpiryDate { get; set; }

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
}
