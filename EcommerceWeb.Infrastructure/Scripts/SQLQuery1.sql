/* ============================================================
   ECOMMERCE TABLES ONLY
   Assumes AspNetUsers / AspNetRoles already exist (Identity)
   ============================================================ */

-- 1) Categories
IF OBJECT_ID(N'dbo.Categories', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Categories (
        Id        INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Name      NVARCHAR(100) NOT NULL UNIQUE,
        ImageUrl  NVARCHAR(500) NULL,
        IsActive  BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL
    );
END;
GO

-- 2) Attributes
IF OBJECT_ID(N'dbo.Attributes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Attributes (
        Id        INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Name      NVARCHAR(100) NOT NULL UNIQUE,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

IF OBJECT_ID(N'dbo.AttributeValues', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AttributeValues (
        Id          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        AttributeId INT NOT NULL,
        Value       NVARCHAR(100) NOT NULL,
        CONSTRAINT FK_AttributeValues_Attributes
            FOREIGN KEY (AttributeId) REFERENCES dbo.Attributes(Id) ON DELETE CASCADE,
        CONSTRAINT UQ_AttributeValues UNIQUE (AttributeId, Value)
    );
END;
GO

-- 3) Products
IF OBJECT_ID(N'dbo.Products', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Products (
        Id            INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Name          NVARCHAR(200) NOT NULL,
        Details       NVARCHAR(MAX) NULL,
        CategoryId    INT NOT NULL,
        Brand         NVARCHAR(100) NULL,
        Price         DECIMAL(18,2) NOT NULL,
        Quantity      INT NOT NULL DEFAULT 0,
        Rating        DECIMAL(3,2) NOT NULL DEFAULT 0,
        FavoriteCount INT NOT NULL DEFAULT 0,
        IsActive      BIT NOT NULL DEFAULT 1,
        CreatedAt     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt     DATETIME2 NULL,
        CONSTRAINT FK_Products_Categories
            FOREIGN KEY (CategoryId) REFERENCES dbo.Categories(Id)
    );
END;
GO

IF OBJECT_ID(N'dbo.ProductImages', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProductImages (
        Id        INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        ProductId INT NOT NULL,
        ImageUrl  NVARCHAR(500) NOT NULL,
        SortOrder INT NOT NULL DEFAULT 0,
        CONSTRAINT FK_ProductImages_Products
            FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id) ON DELETE CASCADE
    );
END;
GO

IF OBJECT_ID(N'dbo.ProductAttributeValues', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProductAttributeValues (
        ProductId        INT NOT NULL,
        AttributeValueId INT NOT NULL,
        PRIMARY KEY (ProductId, AttributeValueId),
        CONSTRAINT FK_PAV_Products
            FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id) ON DELETE CASCADE,
        CONSTRAINT FK_PAV_AttributeValues
            FOREIGN KEY (AttributeValueId) REFERENCES dbo.AttributeValues(Id)
    );
END;
GO

-- 4) UserProfile → AspNetUsers
IF OBJECT_ID(N'dbo.UserProfiles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserProfiles (
        UserId    NVARCHAR(450) NOT NULL PRIMARY KEY,
        FullName  NVARCHAR(150) NULL,
        AvatarUrl NVARCHAR(500) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_UserProfiles_AspNetUsers
            FOREIGN KEY (UserId) REFERENCES dbo.AspNetUsers(Id) ON DELETE CASCADE
    );
END;
GO

-- 5) Favorites → AspNetUsers + Products
IF OBJECT_ID(N'dbo.Favorites', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Favorites (
        UserId    NVARCHAR(450) NOT NULL,
        ProductId INT NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        PRIMARY KEY (UserId, ProductId),
        CONSTRAINT FK_Favorites_AspNetUsers
            FOREIGN KEY (UserId) REFERENCES dbo.AspNetUsers(Id) ON DELETE CASCADE,
        CONSTRAINT FK_Favorites_Products
            FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id) ON DELETE CASCADE
    );
END;
GO

-- 6) Cart → AspNetUsers + Products
IF OBJECT_ID(N'dbo.CartItems', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CartItems (
        Id        INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        UserId    NVARCHAR(450) NOT NULL,
        ProductId INT NOT NULL,
        Quantity  INT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT FK_CartItems_AspNetUsers
            FOREIGN KEY (UserId) REFERENCES dbo.AspNetUsers(Id) ON DELETE CASCADE,
        CONSTRAINT FK_CartItems_Products
            FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id),
        CONSTRAINT UQ_CartItems_User_Product UNIQUE (UserId, ProductId)
    );
END;
GO

-- 7) Promo codes (no user FK)
IF OBJECT_ID(N'dbo.PromoCodes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PromoCodes (
        Id              INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Code            NVARCHAR(50) NOT NULL UNIQUE,
        DiscountAmount  DECIMAL(18,2) NULL,
        DiscountPercent DECIMAL(5,2) NULL,
        IsActive        BIT NOT NULL DEFAULT 1,
        ExpiryDate      DATETIME2 NULL
    );
END;
GO

-- 8) Orders → AspNetUsers
IF OBJECT_ID(N'dbo.Orders', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Orders (
        Id          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        UserId      NVARCHAR(450) NOT NULL,
        Status      NVARCHAR(50) NOT NULL,  -- Pending, Completed, Cancelled
        SubTotal    DECIMAL(18,2) NOT NULL,
        Discount    DECIMAL(18,2) NOT NULL DEFAULT 0,
        DeliveryFee DECIMAL(18,2) NOT NULL DEFAULT 0,
        Total       DECIMAL(18,2) NOT NULL,
        PromoCodeId INT NULL,
        Description NVARCHAR(500) NULL,
        OrderDate   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Orders_AspNetUsers
            FOREIGN KEY (UserId) REFERENCES dbo.AspNetUsers(Id),
        CONSTRAINT FK_Orders_PromoCodes
            FOREIGN KEY (PromoCodeId) REFERENCES dbo.PromoCodes(Id)
    );
END;
GO

IF OBJECT_ID(N'dbo.OrderItems', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OrderItems (
        Id          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        OrderId     INT NOT NULL,
        ProductId   INT NOT NULL,
        ProductName NVARCHAR(200) NOT NULL,
        UnitPrice   DECIMAL(18,2) NOT NULL,
        Quantity    INT NOT NULL,
        LineTotal   DECIMAL(18,2) NOT NULL,
        CONSTRAINT FK_OrderItems_Orders
            FOREIGN KEY (OrderId) REFERENCES dbo.Orders(Id) ON DELETE CASCADE,
        CONSTRAINT FK_OrderItems_Products
            FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id)
    );
END;
GO

-- 9) Settings + Testimonials (no user FK)
IF OBJECT_ID(N'dbo.WebsiteSettings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WebsiteSettings (
        Id           INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        LogoName     NVARCHAR(150) NULL,
        LogoUrl      NVARCHAR(500) NULL,
        BannerUrl    NVARCHAR(500) NULL,
        Phone        NVARCHAR(30) NULL,
        FacebookUrl  NVARCHAR(300) NULL,
        InstagramUrl NVARCHAR(300) NULL,
        TwitterUrl   NVARCHAR(300) NULL,
        TikTokUrl    NVARCHAR(300) NULL,
        UpdatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

IF OBJECT_ID(N'dbo.Testimonials', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Testimonials (
        Id        INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Username  NVARCHAR(100) NOT NULL,
        Rating    DECIMAL(3,2) NOT NULL,
        Comment   NVARCHAR(1000) NOT NULL,
        ImageUrl  NVARCHAR(500) NULL,
        IsActive  BIT NOT NULL DEFAULT 1,
        SortOrder INT NOT NULL DEFAULT 0
    );
END;
GO

/* ============================================================
   ROLES — insert only if not already seeded
   ============================================================ */
IF NOT EXISTS (SELECT 1 FROM dbo.AspNetRoles WHERE NormalizedName = N'ADMIN')
    INSERT INTO dbo.AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp)
    VALUES (NEWID(), N'Admin', N'ADMIN', NEWID());

IF NOT EXISTS (SELECT 1 FROM dbo.AspNetRoles WHERE NormalizedName = N'CUSTOMER')
    INSERT INTO dbo.AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp)
    VALUES (NEWID(), N'Customer', N'CUSTOMER', NEWID());
GO

/* ============================================================
   ASSIGN ADMIN ROLE to existing user (after user is registered)
   ============================================================ */
   select * from AspNetUsers

INSERT INTO dbo.AspNetUserRoles (UserId, RoleId)
SELECT u.Id, r.Id
FROM dbo.AspNetUsers u
CROSS JOIN dbo.AspNetRoles r
WHERE u.NormalizedEmail = N'LEENERTEIL@GMAIL.COM'
  AND r.NormalizedName = N'ADMIN'
  AND NOT EXISTS (
      SELECT 1 FROM dbo.AspNetUserRoles ur
      WHERE ur.UserId = u.Id AND ur.RoleId = r.Id
  );

GO


-- Image storage migration for EcommerceWebDb
-- Run this script on your SQL Server database before using the new upload feature.
--
-- Storage convention:
--   Each uploaded image is saved on disk as 3 WebP files:
--     /uploads/{folder}/{guid}/thumb.webp   (150px max)
--     /uploads/{folder}/{guid}/medium.webp  (600px max)  <-- stored in DB
--     /uploads/{folder}/{guid}/large.webp   (1200px max)
--   The database stores only the medium URL path (e.g. /uploads/categories/abc123/medium.webp).
--   Thumb and large URLs are derived by replacing "medium.webp" in the path.


ALTER TABLE Categories
    ALTER COLUMN ImageUrl NVARCHAR(1000) NULL;
GO

ALTER TABLE ProductImages
    ALTER COLUMN ImageUrl NVARCHAR(1000) NOT NULL;
GO

ALTER TABLE WebsiteSettings
    ALTER COLUMN LogoUrl NVARCHAR(1000) NULL;
GO

ALTER TABLE WebsiteSettings
    ALTER COLUMN BannerUrl NVARCHAR(1000) NULL;
GO

-- Optional: other image columns if you use them later
ALTER TABLE Testimonials
    ALTER COLUMN ImageUrl NVARCHAR(1000) NULL;
GO

ALTER TABLE UserProfiles
    ALTER COLUMN AvatarUrl NVARCHAR(1000) NULL;
GO

PRINT 'Image URL columns expanded to NVARCHAR(1000). Upload feature ready.';
GO

select * from Categories