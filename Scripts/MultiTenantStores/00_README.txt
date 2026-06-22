Multi-tenant store schema — run scripts in order (01 → 11) in SSMS / Azure Data Studio.

Same database as AspNetUsers + StoreSettings + catalog tables.

Theme colors (for admin settings UI — store as hex, e.g. #2563eb or #fff):
  PrimaryColorHex, SecondaryColorHex, AccentColorHex,
  BodyBackgroundHex, HeaderBackgroundHex, FooterBackgroundHex,
  ButtonColorHex, LinkColorHex

Backup the database first. Each script is idempotent (safe to re-run if it completed earlier).

10 — ProductReviews.StoreId (+ trigger keeps it in sync with Products.StoreId; EF can ignore the column).
11 — dbo.StorePromoAds: per-store landing promo cards (slots 1–3); optional until APIs read it.
