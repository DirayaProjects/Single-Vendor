SET NOCOUNT ON;

IF COL_LENGTH(N'dbo.Products', N'StoreId') IS NULL
    ALTER TABLE dbo.Products ADD StoreId INT NULL;
GO

SET NOCOUNT ON;

IF COL_LENGTH(N'dbo.Products', N'StoreId') IS NOT NULL
BEGIN
    UPDATE dbo.Products
    SET StoreId = (SELECT TOP (1) StoreId FROM dbo.Stores ORDER BY StoreId)
    WHERE StoreId IS NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.tables t ON c.object_id = t.object_id
        WHERE t.name = N'Products' AND SCHEMA_NAME(t.schema_id) = N'dbo'
          AND c.name = N'StoreId' AND c.is_nullable = 1
    )
        ALTER TABLE dbo.Products ALTER COLUMN StoreId INT NOT NULL;
END;
GO

SET NOCOUNT ON;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Products_Stores')
    ALTER TABLE dbo.Products ADD CONSTRAINT FK_Products_Stores
        FOREIGN KEY (StoreId) REFERENCES dbo.Stores (StoreId);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_Products_StoreId' AND object_id = OBJECT_ID(N'dbo.Products')
)
    CREATE INDEX IX_Products_StoreId ON dbo.Products (StoreId);

PRINT N'04 OK: Products.StoreId';
GO