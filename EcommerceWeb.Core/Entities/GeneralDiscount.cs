using System;
using System.Collections.Generic;

namespace EcommerceWeb.Core.Entities;

public partial class GeneralDiscount
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public decimal? DiscountPercent { get; set; }

    public decimal? DiscountAmount { get; set; }

    public bool IsActive { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
}
