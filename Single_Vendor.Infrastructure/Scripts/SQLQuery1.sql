/*
  Single_Vendor: store + admin schema for SQL Server
  Prerequisite: ASP.NET Identity (dbo.AspNetUsers, etc.)
*/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE TABLE dbo.Categories (
    CategoryId      INT            IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Name            NVARCHAR(200)  NOT NULL,
    ImageUrl        NVARCHAR(1000) NULL,
    Slug            NVARCHAR(256)  NULL,
    DisplayOrder    INT            NOT NULL CONSTRAINT DF_Categories_DisplayOrder DEFAULT (0),
    IsActive        BIT            NOT NULL CONSTRAINT DF_Categories_IsActive DEFAULT (1),
    CreatedAtUtc    DATETIME2      NOT NULL CONSTRAINT DF_Categories_Created DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc    DATETIME2      NULL
);
CREATE INDEX IX_Categories_IsActive ON dbo.Categories (IsActive);
GO

CREATE TABLE dbo.Products (
    ProductId       INT             IDENTITY(1,1) NOT NULL PRIMARY KEY,
    CategoryId      INT             NULL,
    Name            NVARCHAR(500)   NOT NULL,
    Description     NVARCHAR(MAX)   NULL,
    Brand           NVARCHAR(200)   NULL,
    Price           DECIMAL(18,2)   NOT NULL,
    StockQuantity   INT             NOT NULL CONSTRAINT DF_Products_Stock DEFAULT (0),
    RatingAverage   DECIMAL(3,2)    NOT NULL CONSTRAINT DF_Products_RatingAvg DEFAULT (0),
    RatingCount     INT             NOT NULL CONSTRAINT DF_Products_RatingCount DEFAULT (0),
    FavoriteCount   INT             NOT NULL CONSTRAINT DF_Products_FavCount DEFAULT (0),
    IsActive        BIT             NOT NULL CONSTRAINT DF_Products_IsActive DEFAULT (1),
    CreatedAtUtc    DATETIME2       NOT NULL CONSTRAINT DF_Products_Created DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc    DATETIME2       NULL,
    CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryId) REFERENCES dbo.Categories (CategoryId)
);
CREATE INDEX IX_Products_CategoryId ON dbo.Products (CategoryId);
CREATE INDEX IX_Products_IsActive_Price ON dbo.Products (IsActive, Price);
GO

CREATE TABLE dbo.ProductImages (
    ProductImageId  BIGINT         IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ProductId       INT            NOT NULL,
    ImageUrl        NVARCHAR(1000) NOT NULL,
    SortOrder       INT            NOT NULL CONSTRAINT DF_ProductImages_Sort DEFAULT (0),
    IsPrimary       BIT            NOT NULL CONSTRAINT DF_ProductImages_Primary DEFAULT (0),
    CONSTRAINT FK_ProductImages_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products (ProductId) ON DELETE CASCADE
);
CREATE INDEX IX_ProductImages_ProductId ON dbo.ProductImages (ProductId);
GO

CREATE TABLE dbo.Attributes (
    AttributeId     INT            IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Name            NVARCHAR(200)  NOT NULL,
    DateAdded       DATE           NOT NULL CONSTRAINT DF_Attributes_DateAdded DEFAULT (CAST(SYSUTCDATETIME() AS DATE)),
    CreatedAtUtc    DATETIME2      NOT NULL CONSTRAINT DF_Attributes_Created DEFAULT SYSUTCDATETIME()
);
CREATE UNIQUE INDEX UX_Attributes_Name ON dbo.Attributes (Name);
GO

CREATE TABLE dbo.AttributeValues (
    AttributeValueId BIGINT        IDENTITY(1,1) NOT NULL PRIMARY KEY,
    AttributeId      INT           NOT NULL,
    Value            NVARCHAR(500) NOT NULL,
    SortOrder        INT           NOT NULL CONSTRAINT DF_AttrVals_Sort DEFAULT (0),
    CONSTRAINT FK_AttributeValues_Attributes FOREIGN KEY (AttributeId) REFERENCES dbo.Attributes (AttributeId) ON DELETE CASCADE
);
CREATE INDEX IX_AttributeValues_AttributeId ON dbo.AttributeValues (AttributeId);
GO

CREATE TABLE dbo.ProductSpecifications (
    ProductId   INT            NOT NULL,
    SpecKey     NVARCHAR(200)  NOT NULL,
    SpecValue   NVARCHAR(1000) NOT NULL,
    CONSTRAINT PK_ProductSpecifications PRIMARY KEY (ProductId, SpecKey),
    CONSTRAINT FK_ProductSpecifications_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products (ProductId) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.Orders (
    OrderId         INT             IDENTITY(1,1) NOT NULL PRIMARY KEY,
    UserId          NVARCHAR(450)   NULL,
    CustomerName    NVARCHAR(200)   NOT NULL,
    CustomerEmail   NVARCHAR(256)   NULL,
    Status          NVARCHAR(50)    NOT NULL CONSTRAINT DF_Orders_Status DEFAULT (N'Pending'),
    OrderDate       DATE            NOT NULL CONSTRAINT DF_Orders_OrderDate DEFAULT (CAST(SYSUTCDATETIME() AS DATE)),
    SubTotal        DECIMAL(18,2)   NOT NULL CONSTRAINT DF_Orders_SubTotal DEFAULT (0),
    DiscountAmount  DECIMAL(18,2)   NOT NULL CONSTRAINT DF_Orders_Discount DEFAULT (0),
    DeliveryFee     DECIMAL(18,2)   NOT NULL CONSTRAINT DF_Orders_Delivery DEFAULT (0),
    Total           DECIMAL(18,2)   NOT NULL CONSTRAINT DF_Orders_Total DEFAULT (0),
    Notes           NVARCHAR(500)   NULL,
    CreatedAtUtc    DATETIME2       NOT NULL CONSTRAINT DF_Orders_Created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Orders_AspNetUsers FOREIGN KEY (UserId) REFERENCES dbo.AspNetUsers (Id),
    CONSTRAINT CK_Orders_Status CHECK (Status IN (N'Pending', N'Completed', N'Cancelled', N'Shipped'))
);
CREATE INDEX IX_Orders_UserId ON dbo.Orders (UserId);
CREATE INDEX IX_Orders_OrderDate ON dbo.Orders (OrderDate DESC);
CREATE INDEX IX_Orders_Status ON dbo.Orders (Status);
GO

CREATE TABLE dbo.OrderItems (
    OrderItemId   BIGINT          IDENTITY(1,1) NOT NULL PRIMARY KEY,
    OrderId       INT             NOT NULL,
    ProductId     INT             NOT NULL,
    ProductName   NVARCHAR(500)   NOT NULL,
    Quantity      INT             NOT NULL,
    UnitPrice     DECIMAL(18,2)   NOT NULL,
    CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderId) REFERENCES dbo.Orders (OrderId) ON DELETE CASCADE,
    CONSTRAINT FK_OrderItems_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products (ProductId),
    CONSTRAINT CK_OrderItems_Qty CHECK (Quantity > 0)
);
CREATE INDEX IX_OrderItems_OrderId ON dbo.OrderItems (OrderId);
GO

CREATE TABLE dbo.CartItems (
    UserId      NVARCHAR(450) NOT NULL,
    ProductId   INT           NOT NULL,
    Quantity    INT           NOT NULL CONSTRAINT DF_CartItems_Qty DEFAULT (1),
    AddedAtUtc  DATETIME2     NOT NULL CONSTRAINT DF_CartItems_Added DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_CartItems PRIMARY KEY (UserId, ProductId),
    CONSTRAINT FK_CartItems_AspNetUsers FOREIGN KEY (UserId) REFERENCES dbo.AspNetUsers (Id) ON DELETE CASCADE,
    CONSTRAINT FK_CartItems_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products (ProductId) ON DELETE CASCADE,
    CONSTRAINT CK_CartItems_Qty CHECK (Quantity > 0)
);
GO

CREATE TABLE dbo.WishlistItems (
    UserId       NVARCHAR(450) NOT NULL,
    ProductId    INT           NOT NULL,
    CreatedAtUtc DATETIME2     NOT NULL CONSTRAINT DF_Wishlist_Created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_WishlistItems PRIMARY KEY (UserId, ProductId),
    CONSTRAINT FK_Wishlist_AspNetUsers FOREIGN KEY (UserId) REFERENCES dbo.AspNetUsers (Id) ON DELETE CASCADE,
    CONSTRAINT FK_Wishlist_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products (ProductId) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.ProductReviews (
    ProductReviewId BIGINT       IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ProductId       INT          NOT NULL,
    UserId          NVARCHAR(450) NULL,
    Rating          TINYINT      NOT NULL,
    Comment         NVARCHAR(2000) NULL,
    CreatedAtUtc    DATETIME2    NOT NULL CONSTRAINT DF_Reviews_Created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Reviews_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products (ProductId) ON DELETE CASCADE,
    CONSTRAINT FK_Reviews_AspNetUsers FOREIGN KEY (UserId) REFERENCES dbo.AspNetUsers (Id),
    CONSTRAINT CK_Reviews_Rating CHECK (Rating BETWEEN 1 AND 5)
);
CREATE INDEX IX_ProductReviews_ProductId ON dbo.ProductReviews (ProductId);
GO

CREATE TABLE dbo.StoreSettings (
    StoreSettingId  TINYINT        NOT NULL PRIMARY KEY CONSTRAINT DF_StoreSettings_Id DEFAULT (1),
    StoreDisplayName NVARCHAR(200) NULL,
    LogoUrl         NVARCHAR(1000) NULL,
    BannerUrl       NVARCHAR(1000) NULL,
    FacebookUrl     NVARCHAR(500)  NULL,
    InstagramUrl    NVARCHAR(500)  NULL,
    TwitterUrl      NVARCHAR(500)  NULL,
    TiktokUrl       NVARCHAR(500)  NULL,
    Phone           NVARCHAR(50)   NULL,
    UpdatedAtUtc    DATETIME2      NULL,
    CONSTRAINT CK_StoreSettings_Singleton CHECK (StoreSettingId = 1)
);
GO

CREATE TABLE dbo.PromoCodes (
    PromoCodeId     INT            IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Code            NVARCHAR(50)   NOT NULL,
    DiscountAmount  DECIMAL(18,2)  NULL,
    DiscountPercent DECIMAL(5,2)   NULL,
    IsActive        BIT            NOT NULL CONSTRAINT DF_Promo_IsActive DEFAULT (1),
    ValidFromUtc    DATETIME2      NULL,
    ValidToUtc      DATETIME2      NULL
);
CREATE UNIQUE INDEX UX_PromoCodes_Code ON dbo.PromoCodes (Code);
GO