SET NOCOUNT ON;

IF COL_LENGTH(N'dbo.Attributes', N'StoreId') IS NULL
    ALTER TABLE dbo.Attributes ADD StoreId INT NULL;
GO

SET NOCOUNT ON;

IF COL_LENGTH(N'dbo.Attributes', N'StoreId') IS NOT NULL
BEGIN
    UPDATE dbo.Attributes
    SET StoreId = (SELECT TOP (1) StoreId FROM dbo.Stores ORDER BY StoreId)
    WHERE StoreId IS NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.tables t ON c.object_id = t.object_id
        WHERE t.name = N'Attributes' AND SCHEMA_NAME(t.schema_id) = N'dbo'
          AND c.name = N'StoreId' AND c.is_nullable = 1
    )
        ALTER TABLE dbo.Attributes ALTER COLUMN StoreId INT NOT NULL;
END;
GO

SET NOCOUNT ON;

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

PRINT N'05 OK: Attributes.StoreId';
GO