/*
  =============================================================================
  SINGLE SOURCE for Identity ROLES + USER ASSIGNMENT (run in SSMS / Azure Data Studio)
  =============================================================================
  This script:
    1) Inserts rows into dbo.AspNetRoles     (creates the roles)
    2) Inserts rows into dbo.AspNetUserRoles (links a user to Admin)
    3) Optionally links users with no roles yet to Customer

  Prerequisite: Identity tables already exist (AspNetUsers, AspNetRoles, AspNetUserRoles).
  Table layout is NOT created here — only data.

  Role names used below must match [Authorize(Roles = "Admin")] etc. in your app.
  =============================================================================
*/
select * from AspNetUsers
SET NOCOUNT ON;

/* -------------------------------------------------------------------------- */
/* 1) CREATE ROLES — dbo.AspNetRoles                                          */
/*    Columns: Id, Name, NormalizedName, ConcurrencyStamp                     */
/* -------------------------------------------------------------------------- */
MERGE dbo.AspNetRoles AS t
USING (VALUES
    (N'Admin',     N'ADMIN'),
    (N'Customer',  N'CUSTOMER')
) AS s (Name, NormalizedName)
ON t.NormalizedName = s.NormalizedName
WHEN NOT MATCHED THEN
    INSERT (Id, Name, NormalizedName, ConcurrencyStamp)
    VALUES (CONVERT(NVARCHAR(450), NEWID()), s.Name, s.NormalizedName, CONVERT(NVARCHAR(MAX), NEWID()));

/* -------------------------------------------------------------------------- */
/* 2) ASSIGN ADMIN — dbo.AspNetUserRoles (UserId + RoleId)                    */
/*    Set the email of an EXISTING registered user.                           */
/* -------------------------------------------------------------------------- */
DECLARE @AdminEmail NVARCHAR(256) = N'leenerteil@gmail.com';  /* <<< CHANGE THIS */

DECLARE @UserId NVARCHAR(450) = (
    SELECT Id FROM dbo.AspNetUsers WHERE NormalizedEmail = UPPER(LTRIM(RTRIM(@AdminEmail)))
);

DECLARE @AdminRoleId NVARCHAR(450) = (
    SELECT Id FROM dbo.AspNetRoles WHERE NormalizedName = N'ADMIN'
);

IF @AdminRoleId IS NULL
BEGIN
    RAISERROR(N'AspNetRoles: ADMIN role missing after MERGE.', 16, 1);
    RETURN;
END

IF @UserId IS NULL
BEGIN
    RAISERROR(N'AspNetUsers: no user with that email. Register first, then run again.', 16, 1);
    RETURN;
END

IF NOT EXISTS (
    SELECT 1 FROM dbo.AspNetUserRoles WHERE UserId = @UserId AND RoleId = @AdminRoleId
)
    INSERT INTO dbo.AspNetUserRoles (UserId, RoleId) VALUES (@UserId, @AdminRoleId);

/* -------------------------------------------------------------------------- */
/* 3) OPTIONAL: Customer for users that have zero roles in AspNetUserRoles    */
/* -------------------------------------------------------------------------- */
DECLARE @CustomerRoleId NVARCHAR(450) = (
    SELECT Id FROM dbo.AspNetRoles WHERE NormalizedName = N'CUSTOMER'
);

INSERT INTO dbo.AspNetUserRoles (UserId, RoleId)
SELECT u.Id, @CustomerRoleId
FROM dbo.AspNetUsers u
WHERE @CustomerRoleId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM dbo.AspNetUserRoles ur WHERE ur.UserId = u.Id);

PRINT N'OK: AspNetRoles seeded; Admin assigned for ' + @AdminEmail + N'; users without roles got Customer.';
