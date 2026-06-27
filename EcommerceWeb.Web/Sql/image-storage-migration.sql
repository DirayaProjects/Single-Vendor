-- Image storage migration for EcommerceWebDb
-- Run this script on your SQL Server database before using the new upload feature.
--
-- Storage convention:
--   Each uploaded image is saved on disk as 3 WebP files:
--     /uploads/{folder}/{guid}/thumb.webp   (150px max)
--     /uploads/{folder}/{guid}/medium.webp  (600px max)  <-- stored in DB
--     /uploads/{folder}/{guid}/large.webp   (1200px max)
--   The database stores only the medium URL path (e.g. /uploads/categories/abc123/medium.webp).
--   Thumb and large URLs are derived by replacing "medium.webp" in the path.

USE EcommerceWebDb;
GO

ALTER TABLE Categories
    ALTER COLUMN ImageUrl NVARCHAR(1000) NULL;
GO

ALTER TABLE ProductImages
    ALTER COLUMN ImageUrl NVARCHAR(1000) NOT NULL;
GO

ALTER TABLE WebsiteSettings
    ALTER COLUMN LogoUrl NVARCHAR(1000) NULL;
GO

ALTER TABLE WebsiteSettings
    ALTER COLUMN BannerUrl NVARCHAR(1000) NULL;
GO

-- Optional: other image columns if you use them later
ALTER TABLE Testimonials
    ALTER COLUMN ImageUrl NVARCHAR(1000) NULL;
GO

ALTER TABLE UserProfiles
    ALTER COLUMN AvatarUrl NVARCHAR(1000) NULL;
GO

PRINT 'Image URL columns expanded to NVARCHAR(1000). Upload feature ready.';
GO
