using System;
using System.Collections.Generic;

namespace Single_Vendor.Core.Entities;

public partial class Order
{
    public int OrderId { get; set; }

    public string? UserId { get; set; }

    public string CustomerName { get; set; } = null!;

    public string? CustomerEmail { get; set; }

    public string Status { get; set; } = null!;

    public DateOnly OrderDate { get; set; }

    public decimal SubTotal { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal DeliveryFee { get; set; }

    public decimal Total { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public int StoreId { get; set; }

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual Store Store { get; set; } = null!;

    public virtual AspNetUser? User { get; set; }
}
