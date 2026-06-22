using System;
using System.Collections.Generic;

namespace Single_Vendor.Core.Entities;

public partial class StoreFeatureFlag
{
    public int StoreId { get; set; }

    public bool EnableProductRatingStars { get; set; }

    public bool EnableCustomerProductReviews { get; set; }

    public bool EnableStorefrontTestimonials { get; set; }

    public bool EnablePromoAdsSection { get; set; }

    public bool EnableAdminSalesAnalytics { get; set; }

    public bool EnableAdminOrders { get; set; }

    public bool EnableStorefrontCartCheckout { get; set; }

    public bool EnableWishlistFavorites { get; set; }

    public bool EnableAdminAttributes { get; set; }

    public virtual Store Store { get; set; } = null!;
}
