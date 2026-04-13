/*
  09 — Per-store feature flags (optional modules / UI).
  Run after 01–08. Idempotent.

  Each store has at most one row. Existing stores are backfilled with all features ON
  so behavior stays the same until you change flags.

  New stores created via the API should set flags explicitly (see SuperAdmin create).

  Columns (BIT NOT NULL):
    EnableProductRatingStars      — show aggregate star ratings on storefront
    EnableCustomerProductReviews — customers can submit/update reviews (and related APIs)
    EnableStorefrontTestimonials — landing “testimonials” block (uses public reviews feed)
    EnablePromoAdsSection        — promotional / “sale” spotlight cards on landing
    EnableAdminSalesAnalytics    — admin dashboard revenue / charts / sales-style stats
    EnableAdminOrders            — admin orders module + APIs
    EnableStorefrontCartCheckout — cart, checkout, and order placement from storefront
    EnableWishlistFavorites      — heart / favorites UI on storefront
    EnableAdminAttributes        — admin attributes screen + APIs
*/
SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.StoreFeatureFlags', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.StoreFeatureFlags (
        StoreId                         INT NOT NULL
            CONSTRAINT PK_StoreFeatureFlags PRIMARY KEY
            CONSTRAINT FK_StoreFeatureFlags_Stores FOREIGN KEY (StoreId) REFERENCES dbo.Stores (StoreId) ON DELETE CASCADE,
        EnableProductRatingStars      BIT NOT NULL CONSTRAINT DF_SFF_RatingStars DEFAULT (CONVERT(BIT, 1)),
        EnableCustomerProductReviews  BIT NOT NULL CONSTRAINT DF_SFF_CustomerReviews DEFAULT (CONVERT(BIT, 1)),
        EnableStorefrontTestimonials  BIT NOT NULL CONSTRAINT DF_SFF_Testimonials DEFAULT (CONVERT(BIT, 1)),
        EnablePromoAdsSection         BIT NOT NULL CONSTRAINT DF_SFF_PromoAds DEFAULT (CONVERT(BIT, 1)),
        EnableAdminSalesAnalytics     BIT NOT NULL CONSTRAINT DF_SFF_SalesAnalytics DEFAULT (CONVERT(BIT, 1)),
        EnableAdminOrders             BIT NOT NULL CONSTRAINT DF_SFF_AdminOrders DEFAULT (CONVERT(BIT, 1)),
        EnableStorefrontCartCheckout  BIT NOT NULL CONSTRAINT DF_SFF_CartCheckout DEFAULT (CONVERT(BIT, 1)),
        EnableWishlistFavorites       BIT NOT NULL CONSTRAINT DF_SFF_Wishlist DEFAULT (CONVERT(BIT, 1)),
        EnableAdminAttributes         BIT NOT NULL CONSTRAINT DF_SFF_AdminAttributes DEFAULT (CONVERT(BIT, 1))
    );
END;

/* Backfill: one full-enable row per store that does not have flags yet */
INSERT INTO dbo.StoreFeatureFlags (
    StoreId,
    EnableProductRatingStars,
    EnableCustomerProductReviews,
    EnableStorefrontTestimonials,
    EnablePromoAdsSection,
    EnableAdminSalesAnalytics,
    EnableAdminOrders,
    EnableStorefrontCartCheckout,
    EnableWishlistFavorites,
    EnableAdminAttributes
)
SELECT
    s.StoreId,
    CONVERT(BIT, 1),
    CONVERT(BIT, 1),
    CONVERT(BIT, 1),
    CONVERT(BIT, 1),
    CONVERT(BIT, 1),
    CONVERT(BIT, 1),
    CONVERT(BIT, 1),
    CONVERT(BIT, 1),
    CONVERT(BIT, 1)
FROM dbo.Stores AS s
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.StoreFeatureFlags AS f WHERE f.StoreId = s.StoreId
);

PRINT N'09 OK: StoreFeatureFlags';
GO