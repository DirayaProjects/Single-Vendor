/*
  04 — Orders + PromoCodes: StoreId + unique promo per store
*/
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
