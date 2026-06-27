using System;
using System.Collections.Generic;

namespace EcommerceWeb.Core.Entities;

public partial class Attribute
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<AttributeValue> AttributeValues { get; set; } = new List<AttributeValue>();
}
