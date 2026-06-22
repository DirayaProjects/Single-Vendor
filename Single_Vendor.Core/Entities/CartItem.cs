using System;
using System.Collections.Generic;

namespace Single_Vendor.Core.Entities;

public partial class CartItem
{
    public string UserId { get; set; } = null!;

    public int ProductId { get; set; }

    public int Quantity { get; set; }

    public DateTime AddedAtUtc { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual AspNetUser User { get; set; } = null!;
}
