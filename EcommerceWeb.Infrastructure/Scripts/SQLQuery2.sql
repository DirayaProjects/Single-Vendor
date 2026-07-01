/* ============================================================
   EcommerceWeb — Feature migration script
   Run on: EcommerceWebDb (SQL Server)

   Covers:
     1) Promo ads (landing top 3 + deals page)
     2) Product sale price
     3) Order customer details + Lebanon delivery cities
     4) Spin wheel discounts (+ first-order fallback)
     5) General discounts on selected products

   Safe to re-run: uses IF NOT EXISTS / column checks.
   After running: re-scaffold entities OR add entities manually
   before backend/UI work.
   ============================================================ */

SET NOCOUNT ON;
GO

/* ============================================================
   1) PROMO ADS
   Admin manages ads; landing shows first 3 active (by SortOrder),
   /deals page shows all active ads.
   ============================================================ */
IF OBJECT_ID(N'dbo.PromoAds', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PromoAds
    (
        Id          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_PromoAds PRIMARY KEY,
        Title       NVARCHAR(200)     NOT NULL,
        Subtitle    NVARCHAR(300)     NULL,
        Description NVARCHAR(2000)    NULL,
        ImageUrl    NVARCHAR(1000)    NULL,
        LinkUrl     NVARCHAR(500)     NULL,      -- optional external/product link
        ButtonText  NVARCHAR(100)     NULL,      -- e.g. "Shop Now"
        StartDate   DATETIME2         NULL,
        EndDate     DATETIME2         NULL,
        IsActive    BIT               NOT NULL CONSTRAINT DF_PromoAds_IsActive DEFAULT (1),
        SortOrder   INT               NOT NULL CONSTRAINT DF_PromoAds_SortOrder DEFAULT (0),
        CreatedAt   DATETIME2         NOT NULL CONSTRAINT DF_PromoAds_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt   DATETIME2         NULL
    );

    CREATE INDEX IX_PromoAds_Active_Sort
        ON dbo.PromoAds (IsActive, SortOrder, Id);
END;
GO

/* ============================================================
   2) PRODUCT SALE PRICE
   Price = regular price (shown crossed out when on sale)
   SalePrice = discounted price (must be > 0 and < Price)
   ============================================================ */
IF COL_LENGTH('dbo.Products', 'SalePrice') IS NULL
BEGIN
    ALTER TABLE dbo.Products
        ADD SalePrice DECIMAL(18,2) NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = N'CK_Products_SalePrice_LessThanPrice'
      AND parent_object_id = OBJECT_ID(N'dbo.Products')
)
BEGIN
    ALTER TABLE dbo.Products
        ADD CONSTRAINT CK_Products_SalePrice_LessThanPrice
        CHECK (
            SalePrice IS NULL
            OR (SalePrice > 0 AND SalePrice < Price)
        );
END;
GO

/* Optional: track original price on order line items at checkout time */
IF COL_LENGTH('dbo.OrderItems', 'OriginalUnitPrice') IS NULL
BEGIN
    ALTER TABLE dbo.OrderItems
        ADD OriginalUnitPrice DECIMAL(18,2) NULL;
END;
GO

/* ============================================================
   3) LEBANON DELIVERY CITIES
   Owner defines cities + delivery fee; customer picks at checkout.
   ============================================================ */
IF OBJECT_ID(N'dbo.DeliveryCities', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DeliveryCities
    (
        Id          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_DeliveryCities PRIMARY KEY,
        Name        NVARCHAR(100)     NOT NULL,
        DeliveryFee DECIMAL(18,2)     NOT NULL CONSTRAINT DF_DeliveryCities_Fee DEFAULT (0),
        IsActive    BIT               NOT NULL CONSTRAINT DF_DeliveryCities_IsActive DEFAULT (1),
        SortOrder   INT               NOT NULL CONSTRAINT DF_DeliveryCities_SortOrder DEFAULT (0),
        CreatedAt   DATETIME2         NOT NULL CONSTRAINT DF_DeliveryCities_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt   DATETIME2         NULL,
        CONSTRAINT UQ_DeliveryCities_Name UNIQUE (Name),
        CONSTRAINT CK_DeliveryCities_Fee_NonNegative CHECK (DeliveryFee >= 0)
    );

    CREATE INDEX IX_DeliveryCities_Active_Sort
        ON dbo.DeliveryCities (IsActive, SortOrder, Name);
END;
GO

/* Seed common Lebanon cities (edit fees in admin after deploy) */
IF NOT EXISTS (SELECT 1 FROM dbo.DeliveryCities)
BEGIN
    INSERT INTO dbo.DeliveryCities (Name, DeliveryFee, SortOrder) VALUES
        (N'Beirut',        5.00,  1),
        (N'Tripoli',       8.00,  2),
        (N'Sidon',         7.00,  3),
        (N'Tyre',          9.00,  4),
        (N'Jounieh',       6.00,  5),
        (N'Zahle',         8.00,  6),
        (N'Baalbek',      10.00,  7),
        (N'Nabatieh',      9.00,  8),
        (N'Aley',          7.00,  9),
        (N'Batroun',       8.00, 10),
        (N'Jbeil',         7.00, 11),
        (N'Halba',        12.00, 12),
        (N'Other Lebanon',15.00, 99);
END;
GO

/* ============================================================
   4) ORDER CUSTOMER DETAILS + DELIVERY CITY
   Captured at checkout (name, phone, email, address).
   ============================================================ */
IF COL_LENGTH('dbo.Orders', 'CustomerName') IS NULL
BEGIN
    ALTER TABLE dbo.Orders ADD CustomerName NVARCHAR(150) NULL;
END;
GO

IF COL_LENGTH('dbo.Orders', 'CustomerPhone') IS NULL
BEGIN
    ALTER TABLE dbo.Orders ADD CustomerPhone NVARCHAR(30) NULL;
END;
GO

IF COL_LENGTH('dbo.Orders', 'CustomerEmail') IS NULL
BEGIN
    ALTER TABLE dbo.Orders ADD CustomerEmail NVARCHAR(256) NULL;
END;
GO

IF COL_LENGTH('dbo.Orders', 'CustomerAddress') IS NULL
BEGIN
    ALTER TABLE dbo.Orders ADD CustomerAddress NVARCHAR(500) NULL;
END;
GO

IF COL_LENGTH('dbo.Orders', 'DeliveryCityId') IS NULL
BEGIN
    ALTER TABLE dbo.Orders ADD DeliveryCityId INT NULL;
END;
GO

IF COL_LENGTH('dbo.Orders', 'DeliveryCityName') IS NULL
BEGIN
    /* snapshot city name in case admin renames/deletes city later */
    ALTER TABLE dbo.Orders ADD DeliveryCityName NVARCHAR(100) NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = N'FK_Orders_DeliveryCities'
)
BEGIN
    ALTER TABLE dbo.Orders
        ADD CONSTRAINT FK_Orders_DeliveryCities
        FOREIGN KEY (DeliveryCityId) REFERENCES dbo.DeliveryCities(Id);
END;
GO

/* Expand Description if you want extra notes separate from address */
IF COL_LENGTH('dbo.Orders', 'Description') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Orders
        ALTER COLUMN Description NVARCHAR(1000) NULL;
END;
GO

/* ============================================================
   5) SPIN WHEEL — settings, prizes, user wins
   - SpinWheelEnabled: feature on/off
   - SpinWheelVisible: show/hide wheel to customers
   - When disabled: FirstOrderDiscount* applies on first order only
   ============================================================ */

/* WebsiteSettings feature flags */
IF COL_LENGTH('dbo.WebsiteSettings', 'SpinWheelEnabled') IS NULL
BEGIN
    ALTER TABLE dbo.WebsiteSettings
        ADD SpinWheelEnabled BIT NOT NULL
            CONSTRAINT DF_WebsiteSettings_SpinWheelEnabled DEFAULT (0);
END;
GO

IF COL_LENGTH('dbo.WebsiteSettings', 'SpinWheelVisible') IS NULL
BEGIN
    ALTER TABLE dbo.WebsiteSettings
        ADD SpinWheelVisible BIT NOT NULL
            CONSTRAINT DF_WebsiteSettings_SpinWheelVisible DEFAULT (0);
END;
GO

IF COL_LENGTH('dbo.WebsiteSettings', 'FirstOrderDiscountEnabled') IS NULL
BEGIN
    ALTER TABLE dbo.WebsiteSettings
        ADD FirstOrderDiscountEnabled BIT NOT NULL
            CONSTRAINT DF_WebsiteSettings_FirstOrderDiscountEnabled DEFAULT (1);
END;
GO

IF COL_LENGTH('dbo.WebsiteSettings', 'FirstOrderDiscountPercent') IS NULL
BEGIN
    ALTER TABLE dbo.WebsiteSettings
        ADD FirstOrderDiscountPercent DECIMAL(5,2) NULL;
END;
GO

IF COL_LENGTH('dbo.WebsiteSettings', 'FirstOrderDiscountAmount') IS NULL
BEGIN
    ALTER TABLE dbo.WebsiteSettings
        ADD FirstOrderDiscountAmount DECIMAL(18,2) NULL;
END;
GO

/* General discounts master switch (optional feature) */
IF COL_LENGTH('dbo.WebsiteSettings', 'GeneralDiscountsEnabled') IS NULL
BEGIN
    ALTER TABLE dbo.WebsiteSettings
        ADD GeneralDiscountsEnabled BIT NOT NULL
            CONSTRAINT DF_WebsiteSettings_GeneralDiscountsEnabled DEFAULT (0);
END;
GO

/* Spin wheel prize segments (owner configures in settings) */
IF OBJECT_ID(N'dbo.SpinWheelPrizes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SpinWheelPrizes
    (
        Id              INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_SpinWheelPrizes PRIMARY KEY,
        Label           NVARCHAR(100)     NOT NULL,   -- shown on wheel, e.g. "15% OFF"
        DiscountPercent DECIMAL(5,2)      NULL,
        DiscountAmount  DECIMAL(18,2)     NULL,
        Weight          INT               NOT NULL CONSTRAINT DF_SpinWheelPrizes_Weight DEFAULT (1),
        Color           NVARCHAR(20)      NULL,       -- UI segment color (#hex or name)
        IsActive        BIT               NOT NULL CONSTRAINT DF_SpinWheelPrizes_IsActive DEFAULT (1),
        SortOrder       INT               NOT NULL CONSTRAINT DF_SpinWheelPrizes_SortOrder DEFAULT (0),
        CreatedAt       DATETIME2         NOT NULL CONSTRAINT DF_SpinWheelPrizes_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt       DATETIME2         NULL,
        CONSTRAINT CK_SpinWheelPrizes_Discount CHECK (
            DiscountPercent IS NOT NULL OR DiscountAmount IS NOT NULL
        ),
        CONSTRAINT CK_SpinWheelPrizes_Weight_Positive CHECK (Weight > 0)
    );

    CREATE INDEX IX_SpinWheelPrizes_Active_Sort
        ON dbo.SpinWheelPrizes (IsActive, SortOrder, Id);
END;
GO

/* Each customer spin result (prize won, used on order or not) */
IF OBJECT_ID(N'dbo.UserSpinWheelResults', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserSpinWheelResults
    (
        Id               INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_UserSpinWheelResults PRIMARY KEY,
        UserId           NVARCHAR(450)     NOT NULL,
        SpinWheelPrizeId INT               NOT NULL,
        WonAt            DATETIME2         NOT NULL CONSTRAINT DF_UserSpinWheelResults_WonAt DEFAULT (SYSUTCDATETIME()),
        ExpiresAt        DATETIME2         NULL,
        IsUsed           BIT               NOT NULL CONSTRAINT DF_UserSpinWheelResults_IsUsed DEFAULT (0),
        UsedOnOrderId    INT               NULL,
        CONSTRAINT FK_UserSpinWheelResults_AspNetUsers
            FOREIGN KEY (UserId) REFERENCES dbo.AspNetUsers(Id) ON DELETE CASCADE,
        CONSTRAINT FK_UserSpinWheelResults_SpinWheelPrizes
            FOREIGN KEY (SpinWheelPrizeId) REFERENCES dbo.SpinWheelPrizes(Id),
        CONSTRAINT FK_UserSpinWheelResults_Orders
            FOREIGN KEY (UsedOnOrderId) REFERENCES dbo.Orders(Id)
    );

    CREATE INDEX IX_UserSpinWheelResults_User_Unused
        ON dbo.UserSpinWheelResults (UserId, IsUsed, WonAt DESC);
END;
GO

/* First-order discount tracking (used when spin wheel is OFF) */
IF COL_LENGTH('dbo.UserProfiles', 'FirstOrderDiscountUsed') IS NULL
BEGIN
    ALTER TABLE dbo.UserProfiles
        ADD FirstOrderDiscountUsed BIT NOT NULL
            CONSTRAINT DF_UserProfiles_FirstOrderDiscountUsed DEFAULT (0);
END;
GO

IF COL_LENGTH('dbo.UserProfiles', 'FirstOrderDiscountUsedAt') IS NULL
BEGIN
    ALTER TABLE dbo.UserProfiles
        ADD FirstOrderDiscountUsedAt DATETIME2 NULL;
END;
GO

IF COL_LENGTH('dbo.UserProfiles', 'HasSpunWheel') IS NULL
BEGIN
    ALTER TABLE dbo.UserProfiles
        ADD HasSpunWheel BIT NOT NULL
            CONSTRAINT DF_UserProfiles_HasSpunWheel DEFAULT (0);
END;
GO

/* Link order to applied spin prize (audit) */
IF COL_LENGTH('dbo.Orders', 'SpinWheelPrizeId') IS NULL
BEGIN
    ALTER TABLE dbo.Orders ADD SpinWheelPrizeId INT NULL;
END;
GO

IF COL_LENGTH('dbo.Orders', 'SpinWheelDiscount') IS NULL
BEGIN
    ALTER TABLE dbo.Orders
        ADD SpinWheelDiscount DECIMAL(18,2) NOT NULL
            CONSTRAINT DF_Orders_SpinWheelDiscount DEFAULT (0);
END;
GO

IF COL_LENGTH('dbo.Orders', 'FirstOrderDiscount') IS NULL
BEGIN
    ALTER TABLE dbo.Orders
        ADD FirstOrderDiscount DECIMAL(18,2) NOT NULL
            CONSTRAINT DF_Orders_FirstOrderDiscount DEFAULT (0);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = N'FK_Orders_SpinWheelPrizes'
)
BEGIN
    ALTER TABLE dbo.Orders
        ADD CONSTRAINT FK_Orders_SpinWheelPrizes
        FOREIGN KEY (SpinWheelPrizeId) REFERENCES dbo.SpinWheelPrizes(Id);
END;
GO

/* ============================================================
   6) GENERAL DISCOUNTS (optional, product-specific campaigns)
   Owner creates a discount and picks which products it applies to.
   Stacks conceptually with SalePrice — backend will pick best deal.
   ============================================================ */
IF OBJECT_ID(N'dbo.GeneralDiscounts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GeneralDiscounts
    (
        Id              INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_GeneralDiscounts PRIMARY KEY,
        Name            NVARCHAR(150)     NOT NULL,
        DiscountPercent DECIMAL(5,2)      NULL,
        DiscountAmount  DECIMAL(18,2)     NULL,
        IsActive        BIT               NOT NULL CONSTRAINT DF_GeneralDiscounts_IsActive DEFAULT (1),
        StartDate       DATETIME2         NULL,
        EndDate         DATETIME2         NULL,
        CreatedAt       DATETIME2         NOT NULL CONSTRAINT DF_GeneralDiscounts_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt       DATETIME2         NULL,
        CONSTRAINT CK_GeneralDiscounts_Discount CHECK (
            DiscountPercent IS NOT NULL OR DiscountAmount IS NOT NULL
        )
    );

    CREATE INDEX IX_GeneralDiscounts_Active_Dates
        ON dbo.GeneralDiscounts (IsActive, StartDate, EndDate);
END;
GO

IF OBJECT_ID(N'dbo.GeneralDiscountProducts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.GeneralDiscountProducts
    (
        GeneralDiscountId INT NOT NULL,
        ProductId         INT NOT NULL,
        CONSTRAINT PK_GeneralDiscountProducts PRIMARY KEY (GeneralDiscountId, ProductId),
        CONSTRAINT FK_GDP_GeneralDiscounts
            FOREIGN KEY (GeneralDiscountId) REFERENCES dbo.GeneralDiscounts(Id) ON DELETE CASCADE,
        CONSTRAINT FK_GDP_Products
            FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id) ON DELETE CASCADE
    );

    CREATE INDEX IX_GeneralDiscountProducts_Product
        ON dbo.GeneralDiscountProducts (ProductId);
END;
GO

/* Track general discount amount applied on order (summary) */
IF COL_LENGTH('dbo.Orders', 'GeneralDiscount') IS NULL
BEGIN
    ALTER TABLE dbo.Orders
        ADD GeneralDiscount DECIMAL(18,2) NOT NULL
            CONSTRAINT DF_Orders_GeneralDiscount DEFAULT (0);
END;
GO

IF COL_LENGTH('dbo.Orders', 'ProductSaleDiscount') IS NULL
BEGIN
    /* total saved from product SalePrice vs Price across line items */
    ALTER TABLE dbo.Orders
        ADD ProductSaleDiscount DECIMAL(18,2) NOT NULL
            CONSTRAINT DF_Orders_ProductSaleDiscount DEFAULT (0);
END;
GO

/* ============================================================
   7) SAMPLE SEED DATA (optional — comment out if not wanted)
   ============================================================ */




/* Default first-order discount when spin wheel is disabled */
UPDATE dbo.WebsiteSettings
SET
    SpinWheelEnabled          = 0,
    SpinWheelVisible          = 0,
    FirstOrderDiscountEnabled = 1,
    FirstOrderDiscountPercent = 10.00,
    GeneralDiscountsEnabled   = 0
WHERE Id = (SELECT MIN(Id) FROM dbo.WebsiteSettings);
GO

PRINT 'Feature migration completed successfully.';
PRINT 'New tables: PromoAds, DeliveryCities, SpinWheelPrizes, UserSpinWheelResults, GeneralDiscounts, GeneralDiscountProducts';
PRINT 'Altered: Products (SalePrice), Orders (customer fields, discounts, city), OrderItems (OriginalUnitPrice), WebsiteSettings (feature flags), UserProfiles (spin/first-order flags)';
GO
