using System;
using System.Collections.Generic;

namespace Single_Vendor.Core.Entities;

public partial class ProductSpecification
{
    public int ProductId { get; set; }

    public string SpecKey { get; set; } = null!;

    public string SpecValue { get; set; } = null!;

    public virtual Product Product { get; set; } = null!;
}
