using System;
using System.Collections.Generic;

namespace EcommerceWeb.Core.Entities;

public partial class Order
{
    public int Id { get; set; }

    public string UserId { get; set; } = null!;

    public string Status { get; set; } = null!;

    public decimal SubTotal { get; set; }

    public decimal Discount { get; set; }

    public decimal DeliveryFee { get; set; }

    public decimal Total { get; set; }

    public int? PromoCodeId { get; set; }

    public string? Description { get; set; }

    public DateTime OrderDate { get; set; }

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual PromoCode? PromoCode { get; set; }

    public virtual AspNetUser User { get; set; } = null!;
}
