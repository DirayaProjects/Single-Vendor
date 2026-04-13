/*
  =============================================================================
  SuperAdmin role + assign to one user (run after Identity tables exist).
  Use exact role name: SuperAdmin  (C# [Authorize(Roles = "SuperAdmin")]).
  =============================================================================
*/
SET NOCOUNT ON;

MERGE dbo.AspNetRoles AS t
USING (VALUES
    (N'SuperAdmin', N'SUPERADMIN')
) AS s (Name, NormalizedName)
ON t.NormalizedName = s.NormalizedName
WHEN NOT MATCHED THEN
    INSERT (Id, Name, NormalizedName, ConcurrencyStamp)
    VALUES (CONVERT(NVARCHAR(450), NEWID()), s.Name, s.NormalizedName, CONVERT(NVARCHAR(MAX), NEWID()));

DECLARE @SuperAdminEmail NVARCHAR(256) = N'you@example.com';  /* <<< CHANGE THIS */

DECLARE @UserId NVARCHAR(450) = (
    SELECT Id FROM dbo.AspNetUsers WHERE NormalizedEmail = UPPER(LTRIM(RTRIM(@SuperAdminEmail)))
);

DECLARE @SuperAdminRoleId NVARCHAR(450) = (
    SELECT Id FROM dbo.AspNetRoles WHERE NormalizedName = N'SUPERADMIN'
);

IF @SuperAdminRoleId IS NULL
BEGIN
    RAISERROR(N'SUPERADMIN role missing after MERGE.', 16, 1);
    RETURN;
END

IF @UserId IS NULL
BEGIN
    RAISERROR(N'No user with that email. Register the user first, then run again.', 16, 1);
    RETURN;
END

IF NOT EXISTS (
    SELECT 1 FROM dbo.AspNetUserRoles WHERE UserId = @UserId AND RoleId = @SuperAdminRoleId
)
    INSERT INTO dbo.AspNetUserRoles (UserId, RoleId) VALUES (@UserId, @SuperAdminRoleId);

PRINT N'OK: SuperAdmin role ready; assigned to ' + @SuperAdminEmail;
