/*
  10 — ProductReviews: denormalized StoreId (same store as the product)

  Keeps reviews aligned with multi-tenant catalog without requiring EF model changes:
  new rows still omit StoreId from INSERT; trigger copies Products.StoreId after insert/update.

  Run after 03_Catalog_StoreId.sql (Products.StoreId must exist).
*/
SET NOCOUNT ON;

IF COL_LENGTH(N'dbo.Products', N'StoreId') IS NULL
BEGIN
    RAISERROR(N'Products.StoreId is missing. Run 03_Catalog_StoreId.sql first.', 16, 1);
    RETURN;
END;

IF COL_LENGTH(N'dbo.ProductReviews', N'StoreId') IS NULL
    ALTER TABLE dbo.ProductReviews ADD StoreId INT NULL;

UPDATE pr
SET StoreId = p.StoreId
FROM dbo.ProductReviews AS pr
INNER JOIN dbo.Products AS p ON p.ProductId = pr.ProductId
WHERE pr.StoreId IS NULL OR pr.StoreId <> p.StoreId;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_ProductReviews_Stores')
    ALTER TABLE dbo.ProductReviews ADD CONSTRAINT FK_ProductReviews_Stores
        FOREIGN KEY (StoreId) REFERENCES dbo.Stores (StoreId);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_ProductReviews_StoreId' AND object_id = OBJECT_ID(N'dbo.ProductReviews')
)
    CREATE INDEX IX_ProductReviews_StoreId ON dbo.ProductReviews (StoreId);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes WHERE name = N'IX_ProductReviews_Store_Created' AND object_id = OBJECT_ID(N'dbo.ProductReviews')
)
    CREATE INDEX IX_ProductReviews_Store_Created ON dbo.ProductReviews (StoreId, CreatedAtUtc DESC);

GO

CREATE OR ALTER TRIGGER dbo.TR_ProductReviews_SyncStoreId
ON dbo.ProductReviews
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    /* Avoid recursion when this trigger updates ProductReviews */
    IF TRIGGER_NESTLEVEL() > 1
        RETURN;

    UPDATE pr
    SET StoreId = p.StoreId
    FROM dbo.ProductReviews AS pr
    INNER JOIN inserted AS i ON i.ProductReviewId = pr.ProductReviewId
    INNER JOIN dbo.Products AS p ON p.ProductId = pr.ProductId
    WHERE pr.StoreId IS NULL OR pr.StoreId <> p.StoreId;
END;
GO

PRINT N'10 OK: ProductReviews StoreId + sync trigger';
GO
