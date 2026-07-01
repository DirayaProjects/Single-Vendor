using System;
using System.Collections.Generic;

namespace EcommerceWeb.Core.Entities;

public partial class UserSpinWheelResult
{
    public int Id { get; set; }

    public string UserId { get; set; } = null!;

    public int SpinWheelPrizeId { get; set; }

    public DateTime WonAt { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public bool IsUsed { get; set; }

    public int? UsedOnOrderId { get; set; }

    public virtual SpinWheelPrize SpinWheelPrize { get; set; } = null!;

    public virtual Order? UsedOnOrder { get; set; }

    public virtual AspNetUser User { get; set; } = null!;
}
