namespace Single_Vendor.Web.Models.Api;

public sealed class CheckoutLineRequest
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
}

public sealed class CheckoutRequest
{
    public List<CheckoutLineRequest> Items { get; set; } = new();
    public string? Notes { get; set; }
}

public sealed class CheckoutResponse
{
    public int OrderId { get; set; }
    public decimal Total { get; set; }
    public string Status { get; set; } = "";
}

public sealed class CustomerOrderListResponse
{
    public int OrderId { get; set; }
    public string Status { get; set; } = "";
    public DateOnly OrderDate { get; set; }
    public decimal Total { get; set; }
    public int LineCount { get; set; }
}
