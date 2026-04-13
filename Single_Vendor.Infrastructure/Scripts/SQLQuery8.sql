SET NOCOUNT ON;

IF COL_LENGTH(N'dbo.AspNetUsers', N'StoreId') IS NULL
    ALTER TABLE dbo.AspNetUsers ADD StoreId INT NULL;
GO

SET NOCOUNT ON;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AspNetUsers_Stores_Customer')
    ALTER TABLE dbo.AspNetUsers ADD CONSTRAINT FK_AspNetUsers_Stores_Customer
        FOREIGN KEY (StoreId) REFERENCES dbo.Stores (StoreId);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_AspNetUsers_StoreId' AND object_id = OBJECT_ID(N'dbo.AspNetUsers')
)
    CREATE INDEX IX_AspNetUsers_StoreId ON dbo.AspNetUsers (StoreId);

PRINT N'07 OK: AspNetUsers.StoreId';
GO