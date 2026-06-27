using System;
using System.Collections.Generic;

namespace EcommerceWeb.Core.Entities;

public partial class Testimonial
{
    public int Id { get; set; }

    public string Username { get; set; } = null!;

    public decimal Rating { get; set; }

    public string Comment { get; set; } = null!;

    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; }

    public int SortOrder { get; set; }
}
