/*
  Create SuperAdmin role + assign to one user (AspNetUsers must already exist).
  Role name in code must match: "SuperAdmin"  |  NormalizedName: SUPERADMIN
*/
select * from AspNetUsers
SET NOCOUNT ON;

/* 1) Role: SuperAdmin */
MERGE dbo.AspNetRoles AS t
USING (VALUES
    (N'SuperAdmin', N'SUPERADMIN')
) AS s (Name, NormalizedName)
ON t.NormalizedName = s.NormalizedName
WHEN NOT MATCHED THEN
    INSERT (Id, Name, NormalizedName, ConcurrencyStamp)
    VALUES (CONVERT(NVARCHAR(450), NEWID()), s.Name, s.NormalizedName, CONVERT(NVARCHAR(MAX), NEWID()));

/* 2) Assign SuperAdmin to an existing user */
DECLARE @SuperAdminEmail NVARCHAR(256) = N'alihadiataya@gmail.com';  /* <<< CHANGE THIS */

DECLARE @UserId NVARCHAR(450) = (
    SELECT Id FROM dbo.AspNetUsers WHERE NormalizedEmail = UPPER(LTRIM(RTRIM(@SuperAdminEmail)))
);

DECLARE @SuperAdminRoleId NVARCHAR(450) = (
    SELECT Id FROM dbo.AspNetRoles WHERE NormalizedName = N'SUPERADMIN'
);

IF @SuperAdminRoleId IS NULL
BEGIN
    RAISERROR(N'AspNetRoles: SUPERADMIN role missing after MERGE.', 16, 1);
    RETURN;
END

IF @UserId IS NULL
BEGIN
    RAISERROR(N'AspNetUsers: no user with that email. Create the user first (e.g. Register), then run again.', 16, 1);
    RETURN;
END

IF NOT EXISTS (
    SELECT 1 FROM dbo.AspNetUserRoles WHERE UserId = @UserId AND RoleId = @SuperAdminRoleId
)
    INSERT INTO dbo.AspNetUserRoles (UserId, RoleId) VALUES (@UserId, @SuperAdminRoleId);

PRINT N'OK: SuperAdmin role present; user linked: ' + @SuperAdminEmail;