using System;
using System.Collections.Generic;

namespace Single_Vendor.Core.Entities;

public partial class ProductImage
{
    public long ProductImageId { get; set; }

    public int ProductId { get; set; }

    public string ImageUrl { get; set; } = null!;

    public int SortOrder { get; set; }

    public bool IsPrimary { get; set; }

    public virtual Product Product { get; set; } = null!;
}
