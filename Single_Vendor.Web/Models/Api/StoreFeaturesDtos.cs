using Single_Vendor.Core.Entities;

namespace Single_Vendor.Web.Models.Api;

/// <summary>Feature flags returned to storefront and admin clients (camelCase JSON).</summary>
public sealed class StoreFeaturesResponse
{
    public bool ProductRatingStars { get; set; } = true;
    public bool CustomerProductReviews { get; set; } = true;
    public bool StorefrontTestimonials { get; set; } = true;
    public bool PromoAdsSection { get; set; } = true;
    public bool AdminSalesAnalytics { get; set; } = true;
    public bool AdminOrders { get; set; } = true;
    public bool StorefrontCartCheckout { get; set; } = true;
    public bool WishlistFavorites { get; set; } = true;
    public bool AdminAttributes { get; set; } = true;
}

/// <summary>Optional body when creating a store: each flag defaults to <c>false</c> when this object is sent.</summary>
public sealed class StoreFeaturesUpsertDto
{
    public bool? ProductRatingStars { get; set; }
    public bool? CustomerProductReviews { get; set; }
    public bool? StorefrontTestimonials { get; set; }
    public bool? PromoAdsSection { get; set; }
    public bool? AdminSalesAnalytics { get; set; }
    public bool? AdminOrders { get; set; }
    public bool? StorefrontCartCheckout { get; set; }
    public bool? WishlistFavorites { get; set; }
    public bool? AdminAttributes { get; set; }
}

public static class StoreFeaturesMapper
{
    /// <summary>When no DB row exists, all features are treated as enabled (legacy stores before flags).</summary>
    public static StoreFeaturesResponse ToResponse(StoreFeatureFlag? row)
    {
        if (row is null)
            return new StoreFeaturesResponse();

        return new StoreFeaturesResponse
        {
            ProductRatingStars = row.EnableProductRatingStars,
            CustomerProductReviews = row.EnableCustomerProductReviews,
            StorefrontTestimonials = row.EnableStorefrontTestimonials,
            PromoAdsSection = row.EnablePromoAdsSection,
            AdminSalesAnalytics = row.EnableAdminSalesAnalytics,
            AdminOrders = row.EnableAdminOrders,
            StorefrontCartCheckout = row.EnableStorefrontCartCheckout,
            WishlistFavorites = row.EnableWishlistFavorites,
            AdminAttributes = row.EnableAdminAttributes
        };
    }

    /// <summary>
    /// Builds a row for a new store. If <paramref name="dto"/> is <c>null</c>, all flags are <c>true</c> (API backward compatibility).
    /// If <paramref name="dto"/> is non-null, unspecified properties become <c>false</c>.
    /// </summary>
    public static StoreFeatureFlag CreateRow(int storeId, StoreFeaturesUpsertDto? dto)
    {
        if (dto is null)
        {
            return new StoreFeatureFlag
            {
                StoreId = storeId,
                EnableProductRatingStars = true,
                EnableCustomerProductReviews = true,
                EnableStorefrontTestimonials = true,
                EnablePromoAdsSection = true,
                EnableAdminSalesAnalytics = true,
                EnableAdminOrders = true,
                EnableStorefrontCartCheckout = true,
                EnableWishlistFavorites = true,
                EnableAdminAttributes = true
            };
        }

        static bool Pick(bool? v) => v == true;

        return new StoreFeatureFlag
        {
            StoreId = storeId,
            EnableProductRatingStars = Pick(dto.ProductRatingStars),
            EnableCustomerProductReviews = Pick(dto.CustomerProductReviews),
            EnableStorefrontTestimonials = Pick(dto.StorefrontTestimonials),
            EnablePromoAdsSection = Pick(dto.PromoAdsSection),
            EnableAdminSalesAnalytics = Pick(dto.AdminSalesAnalytics),
            EnableAdminOrders = Pick(dto.AdminOrders),
            EnableStorefrontCartCheckout = Pick(dto.StorefrontCartCheckout),
            EnableWishlistFavorites = Pick(dto.WishlistFavorites),
            EnableAdminAttributes = Pick(dto.AdminAttributes)
        };
    }
}
