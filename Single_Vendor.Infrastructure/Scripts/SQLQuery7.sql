SET NOCOUNT ON;

IF COL_LENGTH(N'dbo.Orders', N'StoreId') IS NULL
    ALTER TABLE dbo.Orders ADD StoreId INT NULL;
GO

SET NOCOUNT ON;

IF COL_LENGTH(N'dbo.Orders', N'StoreId') IS NOT NULL
BEGIN
    UPDATE dbo.Orders
    SET StoreId = (SELECT TOP (1) StoreId FROM dbo.Stores ORDER BY StoreId)
    WHERE StoreId IS NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.tables t ON c.object_id = t.object_id
        WHERE t.name = N'Orders' AND SCHEMA_NAME(t.schema_id) = N'dbo'
          AND c.name = N'StoreId' AND c.is_nullable = 1
    )
        ALTER TABLE dbo.Orders ALTER COLUMN StoreId INT NOT NULL;
END;
GO

SET NOCOUNT ON;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Orders_Stores')
    ALTER TABLE dbo.Orders ADD CONSTRAINT FK_Orders_Stores
        FOREIGN KEY (StoreId) REFERENCES dbo.Stores (StoreId);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_StoreId' AND object_id = OBJECT_ID(N'dbo.Orders')
)
    CREATE INDEX IX_Orders_StoreId ON dbo.Orders (StoreId);

IF COL_LENGTH(N'dbo.PromoCodes', N'StoreId') IS NULL
    ALTER TABLE dbo.PromoCodes ADD StoreId INT NULL;
GO

SET NOCOUNT ON;

IF COL_LENGTH(N'dbo.PromoCodes', N'StoreId') IS NOT NULL
BEGIN
    UPDATE dbo.PromoCodes
    SET StoreId = (SELECT TOP (1) StoreId FROM dbo.Stores ORDER BY StoreId)
    WHERE StoreId IS NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.tables t ON c.object_id = t.object_id
        WHERE t.name = N'PromoCodes' AND SCHEMA_NAME(t.schema_id) = N'dbo'
          AND c.name = N'StoreId' AND c.is_nullable = 1
    )
        ALTER TABLE dbo.PromoCodes ALTER COLUMN StoreId INT NOT NULL;
END;
GO

SET NOCOUNT ON;

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

PRINT N'06 OK: Orders + PromoCodes StoreId';
GO