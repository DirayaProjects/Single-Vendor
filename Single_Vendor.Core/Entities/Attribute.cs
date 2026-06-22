using System;
using System.Collections.Generic;

namespace Single_Vendor.Core.Entities;

public partial class Attribute
{
    public int AttributeId { get; set; }

    public string Name { get; set; } = null!;

    public DateOnly DateAdded { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public int StoreId { get; set; }

    public virtual ICollection<AttributeValue> AttributeValues { get; set; } = new List<AttributeValue>();

    public virtual Store Store { get; set; } = null!;
}
