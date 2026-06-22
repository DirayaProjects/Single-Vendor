/*
  12 — Expand StorePromoAds to support promo library per store
  - Keep unlimited promos per store (within SlotIndex tinyint range)
  - Allow selecting up to 3 for landing via ShowOnLanding + LandingPosition
  - LandingPosition controls landing order (1,2,3)
  - Non-landing promos keep LandingPosition = NULL

  Safe/idempotent migration.
*/
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.StorePromoAds', N'U') IS NULL
BEGIN
    RAISERROR(N'dbo.StorePromoAds does not exist. Run 11_StorePromoAds.sql first.', 16, 1);
    RETURN;
END;
GO

/* 1) Add new columns */
IF COL_LENGTH(N'dbo.StorePromoAds', N'ShowOnLanding') IS NULL
BEGIN
    ALTER TABLE dbo.StorePromoAds
        ADD ShowOnLanding BIT NOT NULL
            CONSTRAINT DF_StorePromoAds_ShowOnLanding DEFAULT (CONVERT(BIT, 1));
END;
GO

IF COL_LENGTH(N'dbo.StorePromoAds', N'LandingPosition') IS NULL
BEGIN
    ALTER TABLE dbo.StorePromoAds
        ADD LandingPosition TINYINT NULL;
END;
GO

/* 2) Relax old 1..3 hard limit on SlotIndex */
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_StorePromoAds_Slot')
BEGIN
    ALTER TABLE dbo.StorePromoAds DROP CONSTRAINT CK_StorePromoAds_Slot;
END;
GO

/* Re-add SlotIndex check: must be >= 1 only */
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_StorePromoAds_Slot_Min1')
BEGIN
    ALTER TABLE dbo.StorePromoAds
        ADD CONSTRAINT CK_StorePromoAds_Slot_Min1 CHECK (SlotIndex >= 1);
END;
GO

/* 3) Backfill LandingPosition from existing first 3 rows if missing */
;WITH cte AS
(
    SELECT
        StorePromoAdId,
        StoreId,
        ROW_NUMBER() OVER (PARTITION BY StoreId ORDER BY SlotIndex, StorePromoAdId) AS rn
    FROM dbo.StorePromoAds
)
UPDATE a
SET
    ShowOnLanding = CASE WHEN c.rn <= 3 THEN CONVERT(BIT, 1) ELSE CONVERT(BIT, 0) END,
    LandingPosition = CASE WHEN c.rn <= 3 THEN CONVERT(TINYINT, c.rn) ELSE NULL END
FROM dbo.StorePromoAds a
INNER JOIN cte c ON c.StorePromoAdId = a.StorePromoAdId
WHERE a.LandingPosition IS NULL;
GO

/* 4) Consistency check constraint */
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_StorePromoAds_LandingShape')
BEGIN
    ALTER TABLE dbo.StorePromoAds
    ADD CONSTRAINT CK_StorePromoAds_LandingShape CHECK (
        (ShowOnLanding = 1 AND LandingPosition BETWEEN 1 AND 3)
        OR
        (ShowOnLanding = 0 AND LandingPosition IS NULL)
    );
END;
GO

/* 5) Ensure landing positions are unique within each store */
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'UX_StorePromoAds_Store_LandingPosition'
      AND object_id = OBJECT_ID(N'dbo.StorePromoAds')
)
BEGIN
    CREATE UNIQUE INDEX UX_StorePromoAds_Store_LandingPosition
        ON dbo.StorePromoAds (StoreId, LandingPosition)
        WHERE ShowOnLanding = 1 AND LandingPosition IS NOT NULL;
END;
GO

/* 6) Optional helpful index for deals page listing */
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_StorePromoAds_Store_IsActive_Slot'
      AND object_id = OBJECT_ID(N'dbo.StorePromoAds')
)
BEGIN
    CREATE INDEX IX_StorePromoAds_Store_IsActive_Slot
        ON dbo.StorePromoAds (StoreId, IsActive, SlotIndex);
END;
GO

PRINT N'12 OK: StorePromoAds expanded for multi-promo + max 3 landing.';
GO