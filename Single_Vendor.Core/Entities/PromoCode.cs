using System;
using System.Collections.Generic;

namespace Single_Vendor.Core.Entities;

public partial class PromoCode
{
    public int PromoCodeId { get; set; }

    public string Code { get; set; } = null!;

    public decimal? DiscountAmount { get; set; }

    public decimal? DiscountPercent { get; set; }

    public bool IsActive { get; set; }

    public DateTime? ValidFromUtc { get; set; }

    public DateTime? ValidToUtc { get; set; }

    public int StoreId { get; set; }

    public virtual Store Store { get; set; } = null!;
}
