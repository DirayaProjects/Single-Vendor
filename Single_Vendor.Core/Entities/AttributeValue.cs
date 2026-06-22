using System;
using System.Collections.Generic;

namespace Single_Vendor.Core.Entities;

public partial class AttributeValue
{
    public long AttributeValueId { get; set; }

    public int AttributeId { get; set; }

    public string Value { get; set; } = null!;

    public int SortOrder { get; set; }

    public virtual Attribute Attribute { get; set; } = null!;
}
