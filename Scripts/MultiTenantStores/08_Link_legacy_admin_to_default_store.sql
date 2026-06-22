/*
  Optional: if an Admin user existed BEFORE SuperAdmin started creating stores,
  they have no dbo.Stores.OwnerUserId row and will get 403 on /api/admin/*.

  Replace the email, then run once.
*/
DECLARE @Email NVARCHAR(256) = N'your-admin@example.com';

DECLARE @UserId NVARCHAR(450) = (
    SELECT Id FROM dbo.AspNetUsers WHERE NormalizedEmail = UPPER(LTRIM(RTRIM(@Email)))
);

IF @UserId IS NULL
BEGIN
    RAISERROR(N'No user with that email.', 16, 1);
    RETURN;
END

IF EXISTS (SELECT 1 FROM dbo.Stores WHERE OwnerUserId = @UserId)
BEGIN
    PRINT N'User already owns a store.';
    RETURN;
END

UPDATE dbo.Stores SET OwnerUserId = @UserId WHERE StoreId = 1 AND OwnerUserId IS NULL;

IF @@ROWCOUNT = 0
    RAISERROR(N'Could not assign: StoreId 1 may already have an owner, or row missing.', 16, 1);
ELSE
    PRINT N'OK: linked admin to StoreId 1.';
GO
