using System;
using System.Collections.Generic;

namespace EcommerceWeb.Core.Entities;

public partial class Favorite
{
    public string UserId { get; set; } = null!;

    public int ProductId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual AspNetUser User { get; set; } = null!;
}
