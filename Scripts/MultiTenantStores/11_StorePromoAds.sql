/*
  11 — Per-store promo / “sale” cards (landing ads), keyed by StoreId

  Three slots per store (1–3) match the default landing promo grid. No C# entity required yet;
  wire APIs when you want admins to edit these. Idempotent.

  Run after 01_Stores.sql.
*/
SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.StorePromoAds', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.StorePromoAds (
        StorePromoAdId  INT            NOT NULL IDENTITY(1, 1)
            CONSTRAINT PK_StorePromoAds PRIMARY KEY,
        StoreId         INT            NOT NULL
            CONSTRAINT FK_StorePromoAds_Stores REFERENCES dbo.Stores (StoreId) ON DELETE CASCADE,
        SlotIndex       TINYINT        NOT NULL,
        TitleLine       NVARCHAR(120)  NOT NULL,
        BigText         NVARCHAR(50)   NOT NULL,
        SubLine         NVARCHAR(120)  NOT NULL,
        LinkUrl         NVARCHAR(1000) NULL,
        ImageUrl        NVARCHAR(1000) NULL,
        IsActive        BIT            NOT NULL CONSTRAINT DF_StorePromoAds_IsActive DEFAULT (CONVERT(BIT, 1)),
        UpdatedAtUtc    DATETIME2      NULL,
        CONSTRAINT CK_StorePromoAds_Slot CHECK (SlotIndex BETWEEN 1 AND 3)
    );

    CREATE UNIQUE INDEX UX_StorePromoAds_Store_Slot ON dbo.StorePromoAds (StoreId, SlotIndex);
    CREATE INDEX IX_StorePromoAds_StoreId ON dbo.StorePromoAds (StoreId);
END;

/* Seed default placeholder rows (only where a slot is still missing) */
INSERT INTO dbo.StorePromoAds (StoreId, SlotIndex, TitleLine, BigText, SubLine, LinkUrl, ImageUrl, IsActive, UpdatedAtUtc)
SELECT s.StoreId, v.SlotIndex, N'SALE UP TO', N'50%', N'OFF', NULL, NULL, CONVERT(BIT, 1), SYSUTCDATETIME()
FROM dbo.Stores AS s
CROSS JOIN (VALUES (1), (2), (3)) AS v(SlotIndex)
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.StorePromoAds AS a
    WHERE a.StoreId = s.StoreId AND a.SlotIndex = v.SlotIndex
);

PRINT N'11 OK: StorePromoAds';
GO
