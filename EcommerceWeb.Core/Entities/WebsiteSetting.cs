using System;
using System.Collections.Generic;

namespace EcommerceWeb.Core.Entities;

public partial class WebsiteSetting
{
    public int Id { get; set; }

    public string? LogoName { get; set; }

    public string? LogoUrl { get; set; }

    public string? BannerUrl { get; set; }

    public string? Phone { get; set; }

    public string? FacebookUrl { get; set; }

    public string? InstagramUrl { get; set; }

    public string? TwitterUrl { get; set; }

    public string? TikTokUrl { get; set; }

    public DateTime UpdatedAt { get; set; }
}
