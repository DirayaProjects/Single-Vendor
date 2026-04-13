/*
  Single_Vendor — full multi-tenant schema apply (01 + 02 + 03 + 04 + 05 + 09 + 10 + 11)

  Idempotent: safe to run on a DB where you already ran 09 (or anything else) today.

  NOT included: 08_Link_legacy_admin_to_default_store.sql — edit that file with your admin
  email and run separately if an old Admin has no store owner row.

  Prerequisites: ASP.NET Identity tables + your existing catalog (StoreSettings, Products, …).
*/
SET NOCOUNT ON;

/* ========== 01 — Stores + default slug ========== */
IF OBJECT_ID(N'dbo.Stores', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Stores (
        StoreId       INT            NOT NULL IDENTITY(1, 1) CONSTRAINT PK_Stores PRIMARY KEY,
        OwnerUserId   NVARCHAR(450)  NULL,
        PublicSlug    NVARCHAR(100)  NOT NULL,
        DisplayName   NVARCHAR(200)  NULL,
        CreatedAtUtc  DATETIME2      NOT NULL CONSTRAINT DF_Stores_CreatedAtUtc DEFAULT (SYSUTCDATETIME()),
        IsActive      BIT            NOT NULL CONSTRAINT DF_Stores_IsActive DEFAULT (CONVERT(BIT, 1)),
        CONSTRAINT FK_Stores_AspNetUsers_Owner
            FOREIGN KEY (OwnerUserId) REFERENCES dbo.AspNetUsers (Id)
    );

    CREATE UNIQUE INDEX UX_Stores_PublicSlug ON dbo.Stores (PublicSlug);
    CREATE UNIQUE INDEX UX_Stores_OwnerUserId ON dbo.Stores (OwnerUserId) WHERE OwnerUserId IS NOT NULL;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.Stores)
    INSERT INTO dbo.Stores (OwnerUserId, PublicSlug, DisplayName)
    VALUES (NULL, N'default', N'Default store');

PRINT N'01 OK: Stores';
GO

/* ========== 02 — StoreSettings: StoreId PK + theme colors ========== */
SET NOCOUNT ON;

DECLARE @dcStoreSettingId SYSNAME;
DECLARE @pkStoreSettings SYSNAME;
DECLARE @sql NVARCHAR(512);

IF COL_LENGTH(N'dbo.StoreSettings', N'StoreId') IS NULL
    ALTER TABLE dbo.StoreSettings ADD StoreId INT NULL;

IF COL_LENGTH(N'dbo.StoreSettings', N'PrimaryColorHex') IS NULL
    ALTER TABLE dbo.StoreSettings ADD PrimaryColorHex NVARCHAR(16) NULL;

IF COL_LENGTH(N'dbo.StoreSettings', N'SecondaryColorHex') IS NULL
    ALTER TABLE dbo.StoreSettings ADD SecondaryColorHex NVARCHAR(16) NULL;

IF COL_LENGTH(N'dbo.StoreSettings', N'AccentColorHex') IS NULL
    ALTER TABLE dbo.StoreSettings ADD AccentColorHex NVARCHAR(16) NULL;

IF COL_LENGTH(N'dbo.StoreSettings', N'BodyBackgroundHex') IS NULL
    ALTER TABLE dbo.StoreSettings ADD BodyBackgroundHex NVARCHAR(16) NULL;

IF COL_LENGTH(N'dbo.StoreSettings', N'HeaderBackgroundHex') IS NULL
    ALTER TABLE dbo.StoreSettings ADD HeaderBackgroundHex NVARCHAR(16) NULL;

IF COL_LENGTH(N'dbo.StoreSettings', N'FooterBackgroundHex') IS NULL
    ALTER TABLE dbo.StoreSettings ADD FooterBackgroundHex NVARCHAR(16) NULL;

IF COL_LENGTH(N'dbo.StoreSettings', N'ButtonColorHex') IS NULL
    ALTER TABLE dbo.StoreSettings ADD ButtonColorHex NVARCHAR(16) NULL;

IF COL_LENGTH(N'dbo.StoreSettings', N'LinkColorHex') IS NULL
    ALTER TABLE dbo.StoreSettings ADD LinkColorHex NVARCHAR(16) NULL;

UPDATE dbo.StoreSettings
SET StoreId = (SELECT TOP (1) StoreId FROM dbo.Stores ORDER BY StoreId)
WHERE StoreId IS NULL;

IF NOT EXISTS (SELECT 1 FROM dbo.StoreSettings)
BEGIN
    IF COL_LENGTH(N'dbo.StoreSettings', N'StoreSettingId') IS NOT NULL
        INSERT INTO dbo.StoreSettings (
            StoreSettingId, StoreId, StoreDisplayName,
            LogoUrl, BannerUrl, FacebookUrl, InstagramUrl, TwitterUrl, TiktokUrl, Phone, UpdatedAtUtc
        )
        VALUES (
            1,
            (SELECT TOP (1) StoreId FROM dbo.Stores ORDER BY StoreId),
            N'Store',
            NULL, NULL, NULL, NULL, NULL, NULL, NULL,
            SYSUTCDATETIME()
        );
    ELSE
        INSERT INTO dbo.StoreSettings (
            StoreId, StoreDisplayName,
            LogoUrl, BannerUrl, FacebookUrl, InstagramUrl, TwitterUrl, TiktokUrl, Phone, UpdatedAtUtc
        )
        VALUES (
            (SELECT TOP (1) StoreId FROM dbo.Stores ORDER BY StoreId),
            N'Store',
            NULL, NULL, NULL, NULL, NULL, NULL, NULL,
            SYSUTCDATETIME()
        );
END;

IF COL_LENGTH(N'dbo.StoreSettings', N'StoreSettingId') IS NOT NULL
BEGIN
    ALTER TABLE dbo.StoreSettings ALTER COLUMN StoreId INT NOT NULL;

    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_StoreSettings_Singleton')
        ALTER TABLE dbo.StoreSettings DROP CONSTRAINT CK_StoreSettings_Singleton;

    SELECT @dcStoreSettingId = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON c.default_object_id = dc.object_id
    INNER JOIN sys.tables t ON t.object_id = c.object_id
    WHERE t.name = N'StoreSettings' AND SCHEMA_NAME(t.schema_id) = N'dbo' AND c.name = N'StoreSettingId';

    IF @dcStoreSettingId IS NOT NULL
    BEGIN
        SET @sql = N'ALTER TABLE dbo.StoreSettings DROP CONSTRAINT ' + QUOTENAME(@dcStoreSettingId);
        EXEC sys.sp_executesql @sql;
    END;

    SELECT @pkStoreSettings = kc.name
    FROM sys.key_constraints kc
    INNER JOIN sys.tables t ON t.object_id = kc.parent_object_id
    WHERE t.name = N'StoreSettings' AND SCHEMA_NAME(t.schema_id) = N'dbo' AND kc.type = N'PK';

    IF @pkStoreSettings IS NOT NULL
    BEGIN
        SET @sql = N'ALTER TABLE dbo.StoreSettings DROP CONSTRAINT ' + QUOTENAME(@pkStoreSettings);
        EXEC sys.sp_executesql @sql;
    END;

    ALTER TABLE dbo.StoreSettings DROP COLUMN StoreSettingId;
    ALTER TABLE dbo.StoreSettings ADD CONSTRAINT PK_StoreSettings PRIMARY KEY (StoreId);
END;

IF COL_LENGTH(N'dbo.StoreSettings', N'StoreId') IS NOT NULL
   AND EXISTS (SELECT 1 FROM dbo.StoreSettings WHERE StoreId IS NULL)
BEGIN
    UPDATE dbo.StoreSettings
    SET StoreId = (SELECT TOP (1) StoreId FROM dbo.Stores ORDER BY StoreId)
    WHERE StoreId IS NULL;

    ALTER TABLE dbo.StoreSettings ALTER COLUMN StoreId INT NOT NULL;
END;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_StoreSettings_Stores')
    ALTER TABLE dbo.StoreSettings ADD CONSTRAINT FK_StoreSettings_Stores
        FOREIGN KEY (StoreId) REFERENCES dbo.Stores (StoreId);

PRINT N'02 OK: StoreSettings + theme color columns';
GO

/* ========== 03 — Categories, Products, Attributes: StoreId ========== */
SET NOCOUNT ON;

IF COL_LENGTH(N'dbo.Categories', N'StoreId') IS NULL
BEGIN
    ALTER TABLE dbo.Categories ADD StoreId INT NULL;
    UPDATE dbo.Categories
    SET StoreId = (SELECT TOP (1) StoreId FROM dbo.Stores ORDER BY StoreId)
    WHERE StoreId IS NULL;
    ALTER TABLE dbo.Categories ALTER COLUMN StoreId INT NOT NULL;
END;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Categories_Stores')
    ALTER TABLE dbo.Categories ADD CONSTRAINT FK_Categories_Stores
        FOREIGN KEY (StoreId) REFERENCES dbo.Stores (StoreId);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_Categories_StoreId' AND object_id = OBJECT_ID(N'dbo.Categories')
)
    CREATE INDEX IX_Categories_StoreId ON dbo.Categories (StoreId);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'UX_Categories_Store_Slug' AND object_id = OBJECT_ID(N'dbo.Categories')
)
    CREATE UNIQUE INDEX UX_Categories_Store_Slug ON dbo.Categories (StoreId, Slug) WHERE Slug IS NOT NULL;

IF COL_LENGTH(N'dbo.Products', N'StoreId') IS NULL
BEGIN
    ALTER TABLE dbo.Products ADD StoreId INT NULL;
    UPDATE dbo.Products
    SET StoreId = (SELECT TOP (1) StoreId FROM dbo.Stores ORDER BY StoreId)
    WHERE StoreId IS NULL;
    ALTER TABLE dbo.Products ALTER COLUMN StoreId INT NOT NULL;
END;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Products_Stores')
    ALTER TABLE dbo.Products ADD CONSTRAINT FK_Products_Stores
        FOREIGN KEY (StoreId) REFERENCES dbo.Stores (StoreId);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_Products_StoreId' AND object_id = OBJECT_ID(N'dbo.Products')
)
    CREATE INDEX IX_Products_StoreId ON dbo.Products (StoreId);

IF COL_LENGTH(N'dbo.Attributes', N'StoreId') IS NULL
BEGIN
    ALTER TABLE dbo.Attributes ADD StoreId INT NULL;
    UPDATE dbo.Attributes
    SET StoreId = (SELECT TOP (1) StoreId FROM dbo.Stores ORDER BY StoreId)
    WHERE StoreId IS NULL;
    ALTER TABLE dbo.Attributes ALTER COLUMN StoreId INT NOT NULL;
END;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Attributes_Stores')
    ALTER TABLE dbo.Attributes ADD CONSTRAINT FK_Attributes_Stores
        FOREIGN KEY (StoreId) REFERENCES dbo.Stores (StoreId);

IF EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'UX_Attributes_Name' AND object_id = OBJECT_ID(N'dbo.Attributes')
)
    DROP INDEX UX_Attributes_Name ON dbo.Attributes;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'UX_Attributes_StoreId_Name' AND object_id = OBJECT_ID(N'dbo.Attributes')
)
    CREATE UNIQUE INDEX UX_Attributes_StoreId_Name ON dbo.Attributes (StoreId, Name);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_Attributes_StoreId' AND object_id = OBJECT_ID(N'dbo.Attributes')
)
    CREATE INDEX IX_Attributes_StoreId ON dbo.Attributes (StoreId);

PRINT N'03 OK: Catalog StoreId';
GO

/* ========== 04 — Orders + PromoCodes: StoreId ========== */
SET NOCOUNT ON;

IF COL_LENGTH(N'dbo.Orders', N'StoreId') IS NULL
BEGIN
    ALTER TABLE dbo.Orders ADD StoreId INT NULL;
    UPDATE dbo.Orders
    SET StoreId = (SELECT TOP (1) StoreId FROM dbo.Stores ORDER BY StoreId)
    WHERE StoreId IS NULL;
    ALTER TABLE dbo.Orders ALTER COLUMN StoreId INT NOT NULL;
END;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Orders_Stores')
    ALTER TABLE dbo.Orders ADD CONSTRAINT FK_Orders_Stores
        FOREIGN KEY (StoreId) REFERENCES dbo.Stores (StoreId);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_StoreId' AND object_id = OBJECT_ID(N'dbo.Orders')
)
    CREATE INDEX IX_Orders_StoreId ON dbo.Orders (StoreId);

IF COL_LENGTH(N'dbo.PromoCodes', N'StoreId') IS NULL
BEGIN
    ALTER TABLE dbo.PromoCodes ADD StoreId INT NULL;
    UPDATE dbo.PromoCodes
    SET StoreId = (SELECT TOP (1) StoreId FROM dbo.Stores ORDER BY StoreId)
    WHERE StoreId IS NULL;
    ALTER TABLE dbo.PromoCodes ALTER COLUMN StoreId INT NOT NULL;
END;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_PromoCodes_Stores')
    ALTER TABLE dbo.PromoCodes ADD CONSTRAINT FK_PromoCodes_Stores
        FOREIGN KEY (StoreId) REFERENCES dbo.Stores (StoreId);

IF EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'UX_PromoCodes_Code' AND object_id = OBJECT_ID(N'dbo.PromoCodes')
)
    DROP INDEX UX_PromoCodes_Code ON dbo.PromoCodes;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'UX_PromoCodes_StoreId_Code' AND object_id = OBJECT_ID(N'dbo.PromoCodes')
)
    CREATE UNIQUE INDEX UX_PromoCodes_StoreId_Code ON dbo.PromoCodes (StoreId, Code);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_PromoCodes_StoreId' AND object_id = OBJECT_ID(N'dbo.PromoCodes')
)
    CREATE INDEX IX_PromoCodes_StoreId ON dbo.PromoCodes (StoreId);

PRINT N'04 OK: Orders + PromoCodes';
GO

/* ========== 05 — AspNetUsers.StoreId ========== */
SET NOCOUNT ON;

IF COL_LENGTH(N'dbo.AspNetUsers', N'StoreId') IS NULL
    ALTER TABLE dbo.AspNetUsers ADD StoreId INT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AspNetUsers_Stores_Customer')
    ALTER TABLE dbo.AspNetUsers ADD CONSTRAINT FK_AspNetUsers_Stores_Customer
        FOREIGN KEY (StoreId) REFERENCES dbo.Stores (StoreId);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_AspNetUsers_StoreId' AND object_id = OBJECT_ID(N'dbo.AspNetUsers')
)
    CREATE INDEX IX_AspNetUsers_StoreId ON dbo.AspNetUsers (StoreId);

PRINT N'05 OK: AspNetUsers.StoreId';
GO

/* ========== 09 — StoreFeatureFlags ========== */
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

/* ========== 10 — ProductReviews.StoreId + trigger ========== */
SET NOCOUNT ON;

IF COL_LENGTH(N'dbo.Products', N'StoreId') IS NULL
BEGIN
    RAISERROR(N'Products.StoreId is missing — earlier section 03 did not apply. Check Products table.', 16, 1);
    RETURN;
END;

IF COL_LENGTH(N'dbo.ProductReviews', N'StoreId') IS NULL
    ALTER TABLE dbo.ProductReviews ADD StoreId INT NULL;

UPDATE pr
SET StoreId = p.StoreId
FROM dbo.ProductReviews AS pr
INNER JOIN dbo.Products AS p ON p.ProductId = pr.ProductId
WHERE pr.StoreId IS NULL OR pr.StoreId <> p.StoreId;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ProductReviews_Stores')
    ALTER TABLE dbo.ProductReviews ADD CONSTRAINT FK_ProductReviews_Stores
        FOREIGN KEY (StoreId) REFERENCES dbo.Stores (StoreId);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_ProductReviews_StoreId' AND object_id = OBJECT_ID(N'dbo.ProductReviews')
)
    CREATE INDEX IX_ProductReviews_StoreId ON dbo.ProductReviews (StoreId);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_ProductReviews_Store_Created' AND object_id = OBJECT_ID(N'dbo.ProductReviews')
)
    CREATE INDEX IX_ProductReviews_Store_Created ON dbo.ProductReviews (StoreId, CreatedAtUtc DESC);

GO

CREATE OR ALTER TRIGGER dbo.TR_ProductReviews_SyncStoreId
ON dbo.ProductReviews
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF TRIGGER_NESTLEVEL() > 1
        RETURN;

    UPDATE pr
    SET StoreId = p.StoreId
    FROM dbo.ProductReviews AS pr
    INNER JOIN inserted AS i ON i.ProductReviewId = pr.ProductReviewId
    INNER JOIN dbo.Products AS p ON p.ProductId = pr.ProductId
    WHERE pr.StoreId IS NULL OR pr.StoreId <> p.StoreId;
END;
GO

PRINT N'10 OK: ProductReviews StoreId + sync trigger';
GO

/* ========== 11 — StorePromoAds ========== */
SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.StorePromoAds', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.StorePromoAds (
        StorePromoAdId  INT            NOT NULL IDENTITY(1, 1)
            CONSTRAINT PK_StorePromoAds PRIMARY KEY,
        StoreId         INT            NOT NULL
            CONSTRAINT FK_StorePromoAds_Stores REFERENCES dbo.Stores (StoreId) ON DELETE CASCADE,
        SlotIndex       TINYINT        NOT NULL,
        TitleLine       NVARCHAR(120)  NOT NULL,
        BigText         NVARCHAR(50)   NOT NULL,
        SubLine         NVARCHAR(120)  NOT NULL,
        LinkUrl         NVARCHAR(1000) NULL,
        ImageUrl        NVARCHAR(1000) NULL,
        IsActive        BIT            NOT NULL CONSTRAINT DF_StorePromoAds_IsActive DEFAULT (CONVERT(BIT, 1)),
        UpdatedAtUtc    DATETIME2      NULL,
        CONSTRAINT CK_StorePromoAds_Slot CHECK (SlotIndex BETWEEN 1 AND 3)
    );

    CREATE UNIQUE INDEX UX_StorePromoAds_Store_Slot ON dbo.StorePromoAds (StoreId, SlotIndex);
    CREATE INDEX IX_StorePromoAds_StoreId ON dbo.StorePromoAds (StoreId);
END;

INSERT INTO dbo.StorePromoAds (StoreId, SlotIndex, TitleLine, BigText, SubLine, LinkUrl, ImageUrl, IsActive, UpdatedAtUtc)
SELECT s.StoreId, v.SlotIndex, N'SALE UP TO', N'50%', N'OFF', NULL, NULL, CONVERT(BIT, 1), SYSUTCDATETIME()
FROM dbo.Stores AS s
CROSS JOIN (VALUES (1), (2), (3)) AS v(SlotIndex)
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.StorePromoAds AS a
    WHERE a.StoreId = s.StoreId AND a.SlotIndex = v.SlotIndex
);

PRINT N'11 OK: StorePromoAds';
PRINT N'FULL_APPLY finished (01–05, 09–11).';
GO
