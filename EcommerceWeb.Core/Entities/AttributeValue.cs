using System;
using System.Collections.Generic;

namespace EcommerceWeb.Core.Entities;

public partial class AttributeValue
{
    public int Id { get; set; }

    public int AttributeId { get; set; }

    public string Value { get; set; } = null!;

    public virtual Attribute Attribute { get; set; } = null!;

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
}
