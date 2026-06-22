using System;
using System.Collections.Generic;

namespace Single_Vendor.Core.Entities;

public partial class WishlistItem
{
    public string UserId { get; set; } = null!;

    public int ProductId { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual AspNetUser User { get; set; } = null!;
}
