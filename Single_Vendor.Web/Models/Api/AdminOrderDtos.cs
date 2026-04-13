namespace Single_Vendor.Web.Models.Api;

public sealed class OrderAdminListResponse
{
    public int OrderId { get; set; }
    public string CustomerName { get; set; } = "";
    public string? CustomerEmail { get; set; }
    public decimal SubTotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal DeliveryFee { get; set; }
    public decimal Total { get; set; }
    public string Status { get; set; } = "";
    public DateOnly OrderDate { get; set; }
    public string? Notes { get; set; }
}

public sealed class OrderCreateRequest
{
    public string CustomerName { get; set; } = "";
    public string? CustomerEmail { get; set; }
    public string Status { get; set; } = "Pending";
    public DateOnly OrderDate { get; set; }
    public string? Notes { get; set; }
    public IReadOnlyList<OrderItemCreateRequest>? Items { get; set; }
}

public sealed class OrderItemCreateRequest
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
}

public sealed class OrderUpdateRequest
{
    public string CustomerName { get; set; } = "";
    public string? CustomerEmail { get; set; }
    public string Status { get; set; } = "";
    public DateOnly OrderDate { get; set; }
    public string? Notes { get; set; }
    public decimal SubTotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal DeliveryFee { get; set; }
    public decimal Total { get; set; }
}
