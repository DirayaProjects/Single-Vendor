using System;
using System.Collections.Generic;

namespace EcommerceWeb.Core.Entities;

public partial class DeliveryCity
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public decimal DeliveryFee { get; set; }

    public bool IsActive { get; set; }

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
}
