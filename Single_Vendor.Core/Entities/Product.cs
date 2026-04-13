using System;
using System.Collections.Generic;

namespace Single_Vendor.Core.Entities;

public partial class Product
{
    public int ProductId { get; set; }

    public int? CategoryId { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public string? Brand { get; set; }

    public decimal Price { get; set; }

    public int StockQuantity { get; set; }

    public decimal RatingAverage { get; set; }

    public int RatingCount { get; set; }

    public int FavoriteCount { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public int StoreId { get; set; }

    public virtual ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();

    public virtual Category? Category { get; set; }

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual ICollection<ProductImage> ProductImages { get; set; } = new List<ProductImage>();

    public virtual ICollection<ProductReview> ProductReviews { get; set; } = new List<ProductReview>();

    public virtual ICollection<ProductSpecification> ProductSpecifications { get; set; } = new List<ProductSpecification>();

    public virtual Store Store { get; set; } = null!;

    public virtual ICollection<WishlistItem> WishlistItems { get; set; } = new List<WishlistItem>();
}
