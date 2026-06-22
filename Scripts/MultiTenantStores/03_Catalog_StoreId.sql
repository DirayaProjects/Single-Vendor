/*
  03 — Categories, Products, Attributes: add StoreId + indexes
*/
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
