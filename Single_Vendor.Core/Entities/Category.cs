using System;
using System.Collections.Generic;

namespace Single_Vendor.Core.Entities;

public partial class Category
{
    public int CategoryId { get; set; }

    public string Name { get; set; } = null!;

    public string? ImageUrl { get; set; }

    public string? Slug { get; set; }

    public int DisplayOrder { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public int StoreId { get; set; }

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();

    public virtual Store Store { get; set; } = null!;
}
