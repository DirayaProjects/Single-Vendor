/*
  02 — StoreSettings: StoreId PK + theme color columns (admin-configurable)

  Your admin “site appearance” screen should read/write these (NVARCHAR, typically #RRGGBB):
    PrimaryColorHex       — main brand / buttons
    SecondaryColorHex     — secondary surfaces
    AccentColorHex      — highlights, badges
    BodyBackgroundHex   — page background
    HeaderBackgroundHex — top bar / nav background
    FooterBackgroundHex — footer background
    ButtonColorHex      — primary button fill (if different from Primary)
    LinkColorHex        — hyperlink color

  One row per store; PK = StoreId (matches dbo.Stores).
*/
SET NOCOUNT ON;

DECLARE @dcStoreSettingId SYSNAME;
DECLARE @pkStoreSettings SYSNAME;
DECLARE @sql NVARCHAR(512);

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

UPDATE dbo.StoreSettings
SET StoreId = (SELECT TOP (1) StoreId FROM dbo.Stores ORDER BY StoreId)
WHERE StoreId IS NULL;

IF NOT EXISTS (SELECT 1 FROM dbo.StoreSettings)
BEGIN
    IF COL_LENGTH(N'dbo.StoreSettings', N'StoreSettingId') IS NOT NULL
        INSERT INTO dbo.StoreSettings (
            StoreSettingId, StoreId, StoreDisplayName,
            LogoUrl, BannerUrl, FacebookUrl, InstagramUrl, TwitterUrl, TiktokUrl, Phone, UpdatedAtUtc
        )
        VALUES (
            1,
            (SELECT TOP (1) StoreId FROM dbo.Stores ORDER BY StoreId),
            N'Store',
            NULL, NULL, NULL, NULL, NULL, NULL, NULL,
            SYSUTCDATETIME()
        );
    ELSE
        INSERT INTO dbo.StoreSettings (
            StoreId, StoreDisplayName,
            LogoUrl, BannerUrl, FacebookUrl, InstagramUrl, TwitterUrl, TiktokUrl, Phone, UpdatedAtUtc
        )
        VALUES (
            (SELECT TOP (1) StoreId FROM dbo.Stores ORDER BY StoreId),
            N'Store',
            NULL, NULL, NULL, NULL, NULL, NULL, NULL,
            SYSUTCDATETIME()
        );
END;

IF COL_LENGTH(N'dbo.StoreSettings', N'StoreSettingId') IS NOT NULL
BEGIN
    ALTER TABLE dbo.StoreSettings ALTER COLUMN StoreId INT NOT NULL;

    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_StoreSettings_Singleton')
        ALTER TABLE dbo.StoreSettings DROP CONSTRAINT CK_StoreSettings_Singleton;

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
    UPDATE dbo.StoreSettings
    SET StoreId = (SELECT TOP (1) StoreId FROM dbo.Stores ORDER BY StoreId)
    WHERE StoreId IS NULL;

    ALTER TABLE dbo.StoreSettings ALTER COLUMN StoreId INT NOT NULL;
END;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_StoreSettings_Stores')
    ALTER TABLE dbo.StoreSettings ADD CONSTRAINT FK_StoreSettings_Stores
        FOREIGN KEY (StoreId) REFERENCES dbo.Stores (StoreId);

PRINT N'02 OK: StoreSettings + theme color columns';
GO
