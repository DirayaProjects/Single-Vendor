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

    public string? CustomerName { get; set; }

    public string? CustomerPhone { get; set; }

    public string? CustomerEmail { get; set; }

    public string? CustomerAddress { get; set; }

    public int? DeliveryCityId { get; set; }

    public string? DeliveryCityName { get; set; }

    public int? SpinWheelPrizeId { get; set; }

    public decimal SpinWheelDiscount { get; set; }

    public decimal FirstOrderDiscount { get; set; }

    public decimal GeneralDiscount { get; set; }

    public decimal ProductSaleDiscount { get; set; }

    public virtual DeliveryCity? DeliveryCity { get; set; }

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual PromoCode? PromoCode { get; set; }

    public virtual SpinWheelPrize? SpinWheelPrize { get; set; }

    public virtual AspNetUser User { get; set; } = null!;

    public virtual ICollection<UserSpinWheelResult> UserSpinWheelResults { get; set; } = new List<UserSpinWheelResult>();
}
