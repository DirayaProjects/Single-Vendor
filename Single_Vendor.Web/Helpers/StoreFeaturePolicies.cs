using Single_Vendor.Core.Entities;

namespace Single_Vendor.Web.Helpers;

/// <summary>Null <see cref="StoreFeatureFlag"/> means legacy DB row missing — treat as fully enabled.</summary>
public static class StoreFeaturePolicies
{
    public static bool CustomerReviewsEnabled(StoreFeatureFlag? f) =>
        f is null || f.EnableCustomerProductReviews;

    public static bool RatingStarsEnabled(StoreFeatureFlag? f) =>
        f is null || f.EnableProductRatingStars;

    public static bool TestimonialsEnabled(StoreFeatureFlag? f) =>
        f is null || f.EnableStorefrontTestimonials;

    public static bool CartCheckoutEnabled(StoreFeatureFlag? f) =>
        f is null || f.EnableStorefrontCartCheckout;

    public static bool AdminOrdersEnabled(StoreFeatureFlag? f) =>
        f is null || f.EnableAdminOrders;

    public static bool AdminAttributesEnabled(StoreFeatureFlag? f) =>
        f is null || f.EnableAdminAttributes;

    public static bool AdminSalesAnalyticsEnabled(StoreFeatureFlag? f) =>
        f is null || f.EnableAdminSalesAnalytics;

    public static bool PromoAdsSectionEnabled(StoreFeatureFlag? f) =>
        f is null || f.EnablePromoAdsSection;

    public static bool WishlistEnabled(StoreFeatureFlag? f) =>
        f is null || f.EnableWishlistFavorites;
}
