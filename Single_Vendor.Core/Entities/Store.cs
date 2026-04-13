using System;
using System.Collections.Generic;

namespace Single_Vendor.Core.Entities;

public partial class Store
{
    public int StoreId { get; set; }

    public string? OwnerUserId { get; set; }

    public string PublicSlug { get; set; } = null!;

    public string? DisplayName { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<AspNetUser> AspNetUsers { get; set; } = new List<AspNetUser>();

    public virtual ICollection<Attribute> Attributes { get; set; } = new List<Attribute>();

    public virtual ICollection<Category> Categories { get; set; } = new List<Category>();

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    public virtual AspNetUser? OwnerUser { get; set; }

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();

    public virtual ICollection<PromoCode> PromoCodes { get; set; } = new List<PromoCode>();

    public virtual StoreFeatureFlag? StoreFeatureFlag { get; set; }

    public virtual StoreSetting? StoreSetting { get; set; }

    public virtual ICollection<StorePromoAd> StorePromoAds { get; set; } = new List<StorePromoAd>();
}
