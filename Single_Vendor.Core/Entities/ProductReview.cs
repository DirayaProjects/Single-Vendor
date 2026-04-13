using System;
using System.Collections.Generic;

namespace Single_Vendor.Core.Entities;

public partial class ProductReview
{
    public long ProductReviewId { get; set; }

    public int ProductId { get; set; }

    /// <summary>Denormalized from <see cref="Product.StoreId"/> (see SQL script 10).</summary>
    public int? StoreId { get; set; }

    public string? UserId { get; set; }

    public byte Rating { get; set; }

    public string? Comment { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual Store? Store { get; set; }

    public virtual AspNetUser? User { get; set; }
}
