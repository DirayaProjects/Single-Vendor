using System;
using System.Collections.Generic;

namespace EcommerceWeb.Core.Entities;

public partial class UserProfile
{
    public string UserId { get; set; } = null!;

    public string? FullName { get; set; }

    public string? AvatarUrl { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual AspNetUser User { get; set; } = null!;
}
