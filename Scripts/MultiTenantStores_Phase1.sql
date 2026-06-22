/*
  Prefer the split scripts (easier to run/debug):
    Scripts/MultiTenantStores/01_Stores.sql
    … then 02, 03, 04, 05 — see Scripts/MultiTenantStores/00_README.txt

  This file is one-shot: DECLARE must be BEFORE BEGIN TRY (SQL Server rule).
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @DefaultStoreId INT;
DECLARE @dcStoreSettingId SYSNAME;
DECLARE @pkStoreSettings SYSNAME;
DECLARE @sql NVARCHAR(512);

BEGIN TRY
    BEGIN TRAN;

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

    SET @DefaultStoreId = (SELECT TOP (1) StoreId FROM dbo.Stores ORDER BY StoreId);

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

    UPDATE dbo.StoreSettings SET StoreId = @DefaultStoreId WHERE StoreId IS NULL;

    IF NOT EXISTS (SELECT 1 FROM dbo.StoreSettings)
    BEGIN
        IF COL_LENGTH(N'dbo.StoreSettings', N'StoreSettingId') IS NOT NULL
            INSERT INTO dbo.StoreSettings (
                StoreSettingId, StoreId, StoreDisplayName,
                LogoUrl, BannerUrl, FacebookUrl, InstagramUrl, TwitterUrl, TiktokUrl, Phone, UpdatedAtUtc
            )
            VALUES (1, @DefaultStoreId, N'Store', NULL, NULL, NULL, NULL, NULL, NULL, NULL, SYSUTCDATETIME());
        ELSE
            INSERT INTO dbo.StoreSettings (
                StoreId, StoreDisplayName,
                LogoUrl, BannerUrl, FacebookUrl, InstagramUrl, TwitterUrl, TiktokUrl, Phone, UpdatedAtUtc
            )
            VALUES (@DefaultStoreId, N'Store', NULL, NULL, NULL, NULL, NULL, NULL, NULL, SYSUTCDATETIME());
    END;

    IF COL_LENGTH(N'dbo.StoreSettings', N'StoreSettingId') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.StoreSettings ALTER COLUMN StoreId INT NOT NULL;
        IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_StoreSettings_Singleton')
            ALTER TABLE dbo.StoreSettings DROP CONSTRAINT CK_StoreSettings_Singleton;

        SET @dcStoreSettingId = NULL;
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

        SET @pkStoreSettings = NULL;
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
        UPDATE dbo.StoreSettings SET StoreId = @DefaultStoreId WHERE StoreId IS NULL;
        ALTER TABLE dbo.StoreSettings ALTER COLUMN StoreId INT NOT NULL;
    END;

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_StoreSettings_Stores')
        ALTER TABLE dbo.StoreSettings ADD CONSTRAINT FK_StoreSettings_Stores
            FOREIGN KEY (StoreId) REFERENCES dbo.Stores (StoreId);

    IF COL_LENGTH(N'dbo.Categories', N'StoreId') IS NULL
    BEGIN
        ALTER TABLE dbo.Categories ADD StoreId INT NULL;
        UPDATE dbo.Categories SET StoreId = @DefaultStoreId WHERE StoreId IS NULL;
        ALTER TABLE dbo.Categories ALTER COLUMN StoreId INT NOT NULL;
    END;
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Categories_Stores')
        ALTER TABLE dbo.Categories ADD CONSTRAINT FK_Categories_Stores FOREIGN KEY (StoreId) REFERENCES dbo.Stores (StoreId);
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Categories_StoreId' AND object_id = OBJECT_ID(N'dbo.Categories'))
        CREATE INDEX IX_Categories_StoreId ON dbo.Categories (StoreId);
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Categories_Store_Slug' AND object_id = OBJECT_ID(N'dbo.Categories'))
        CREATE UNIQUE INDEX UX_Categories_Store_Slug ON dbo.Categories (StoreId, Slug) WHERE Slug IS NOT NULL;

    IF COL_LENGTH(N'dbo.Products', N'StoreId') IS NULL
    BEGIN
        ALTER TABLE dbo.Products ADD StoreId INT NULL;
        UPDATE dbo.Products SET StoreId = @DefaultStoreId WHERE StoreId IS NULL;
        ALTER TABLE dbo.Products ALTER COLUMN StoreId INT NOT NULL;
    END;
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Products_Stores')
        ALTER TABLE dbo.Products ADD CONSTRAINT FK_Products_Stores FOREIGN KEY (StoreId) REFERENCES dbo.Stores (StoreId);
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Products_StoreId' AND object_id = OBJECT_ID(N'dbo.Products'))
        CREATE INDEX IX_Products_StoreId ON dbo.Products (StoreId);

    IF COL_LENGTH(N'dbo.Attributes', N'StoreId') IS NULL
    BEGIN
        ALTER TABLE dbo.Attributes ADD StoreId INT NULL;
        UPDATE dbo.Attributes SET StoreId = @DefaultStoreId WHERE StoreId IS NULL;
        ALTER TABLE dbo.Attributes ALTER COLUMN StoreId INT NOT NULL;
    END;
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Attributes_Stores')
        ALTER TABLE dbo.Attributes ADD CONSTRAINT FK_Attributes_Stores FOREIGN KEY (StoreId) REFERENCES dbo.Stores (StoreId);
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Attributes_Name' AND object_id = OBJECT_ID(N'dbo.Attributes'))
        DROP INDEX UX_Attributes_Name ON dbo.Attributes;
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Attributes_StoreId_Name' AND object_id = OBJECT_ID(N'dbo.Attributes'))
        CREATE UNIQUE INDEX UX_Attributes_StoreId_Name ON dbo.Attributes (StoreId, Name);
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Attributes_StoreId' AND object_id = OBJECT_ID(N'dbo.Attributes'))
        CREATE INDEX IX_Attributes_StoreId ON dbo.Attributes (StoreId);

    IF COL_LENGTH(N'dbo.Orders', N'StoreId') IS NULL
    BEGIN
        ALTER TABLE dbo.Orders ADD StoreId INT NULL;
        UPDATE dbo.Orders SET StoreId = @DefaultStoreId WHERE StoreId IS NULL;
        ALTER TABLE dbo.Orders ALTER COLUMN StoreId INT NOT NULL;
    END;
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Orders_Stores')
        ALTER TABLE dbo.Orders ADD CONSTRAINT FK_Orders_Stores FOREIGN KEY (StoreId) REFERENCES dbo.Stores (StoreId);
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_StoreId' AND object_id = OBJECT_ID(N'dbo.Orders'))
        CREATE INDEX IX_Orders_StoreId ON dbo.Orders (StoreId);

    IF COL_LENGTH(N'dbo.PromoCodes', N'StoreId') IS NULL
    BEGIN
        ALTER TABLE dbo.PromoCodes ADD StoreId INT NULL;
        UPDATE dbo.PromoCodes SET StoreId = @DefaultStoreId WHERE StoreId IS NULL;
        ALTER TABLE dbo.PromoCodes ALTER COLUMN StoreId INT NOT NULL;
    END;
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_PromoCodes_Stores')
        ALTER TABLE dbo.PromoCodes ADD CONSTRAINT FK_PromoCodes_Stores FOREIGN KEY (StoreId) REFERENCES dbo.Stores (StoreId);
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_PromoCodes_Code' AND object_id = OBJECT_ID(N'dbo.PromoCodes'))
        DROP INDEX UX_PromoCodes_Code ON dbo.PromoCodes;
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_PromoCodes_StoreId_Code' AND object_id = OBJECT_ID(N'dbo.PromoCodes'))
        CREATE UNIQUE INDEX UX_PromoCodes_StoreId_Code ON dbo.PromoCodes (StoreId, Code);
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PromoCodes_StoreId' AND object_id = OBJECT_ID(N'dbo.PromoCodes'))
        CREATE INDEX IX_PromoCodes_StoreId ON dbo.PromoCodes (StoreId);

    IF COL_LENGTH(N'dbo.AspNetUsers', N'StoreId') IS NULL
        ALTER TABLE dbo.AspNetUsers ADD StoreId INT NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_AspNetUsers_Stores_Customer')
        ALTER TABLE dbo.AspNetUsers ADD CONSTRAINT FK_AspNetUsers_Stores_Customer
            FOREIGN KEY (StoreId) REFERENCES dbo.Stores (StoreId);
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AspNetUsers_StoreId' AND object_id = OBJECT_ID(N'dbo.AspNetUsers'))
        CREATE INDEX IX_AspNetUsers_StoreId ON dbo.AspNetUsers (StoreId);

    COMMIT TRAN;
    PRINT N'OK: Multi-tenant schema. Default StoreId = ' + CAST(@DefaultStoreId AS NVARCHAR(20));
END TRY
BEGIN CATCH
    DECLARE @err NVARCHAR(4000);
    SET @err = ERROR_MESSAGE();
    IF @@TRANCOUNT > 0 ROLLBACK TRAN;
    RAISERROR(N'Failed: %s', 16, 1, @err);
END CATCH;
