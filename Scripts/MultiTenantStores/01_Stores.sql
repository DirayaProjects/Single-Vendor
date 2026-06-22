/*
  01 — dbo.Stores + seed row (slug "default")
  Run first.
*/
SET NOCOUNT ON;

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

PRINT N'01 OK: Stores';
GO
