/*
    DB_Migration_Auth_Role_UserRole.sql
    Migration mềm: chuyển schema auth cũ (Users.Role) sang schema mới (Roles, UserRoles)
    mà không reset database.
*/

USE [WebQuanLyRapPhim];
GO

-- 1) Tạo bảng Roles nếu chưa có
IF OBJECT_ID(N'[dbo].[Roles]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Roles]
    (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Name] NVARCHAR(450) NOT NULL
    );
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Roles_Name'
      AND object_id = OBJECT_ID(N'[dbo].[Roles]')
)
BEGIN
    CREATE UNIQUE INDEX [IX_Roles_Name] ON [dbo].[Roles]([Name]);
END
GO

-- 2) Seed role chuẩn
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = N'Admin')
    INSERT INTO [dbo].[Roles]([Name]) VALUES (N'Admin');
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = N'Staff')
    INSERT INTO [dbo].[Roles]([Name]) VALUES (N'Staff');
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = N'Customer')
    INSERT INTO [dbo].[Roles]([Name]) VALUES (N'Customer');
GO

-- 3) Tạo bảng UserRoles nếu chưa có
IF OBJECT_ID(N'[dbo].[UserRoles]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[UserRoles]
    (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [UserId] INT NOT NULL,
        [RoleId] INT NOT NULL,
        CONSTRAINT [FK_UserRoles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]),
        CONSTRAINT [FK_UserRoles_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [dbo].[Roles]([Id])
    );
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_UserRoles_UserId_RoleId'
      AND object_id = OBJECT_ID(N'[dbo].[UserRoles]')
)
BEGIN
    CREATE UNIQUE INDEX [IX_UserRoles_UserId_RoleId]
        ON [dbo].[UserRoles]([UserId], [RoleId]);
END
GO

-- 4) Nếu schema cũ có Users.Role => migrate dữ liệu sang UserRoles
IF COL_LENGTH('dbo.Users', 'Role') IS NOT NULL
BEGIN
    ;WITH MapRole AS
    (
        SELECT
            u.Id AS UserId,
            CASE
                WHEN TRY_CONVERT(INT, u.[Role]) = 1 THEN N'Admin'
                WHEN TRY_CONVERT(INT, u.[Role]) = 2 THEN N'Staff'
                WHEN TRY_CONVERT(INT, u.[Role]) = 3 THEN N'Customer'
                WHEN UPPER(CONVERT(NVARCHAR(50), u.[Role])) = N'ADMIN' THEN N'Admin'
                WHEN UPPER(CONVERT(NVARCHAR(50), u.[Role])) IN (N'STAFF', N'NHANVIEN') THEN N'Staff'
                WHEN UPPER(CONVERT(NVARCHAR(50), u.[Role])) IN (N'CUSTOMER', N'KHACHHANG') THEN N'Customer'
                ELSE N'Customer'
            END AS RoleName
        FROM [dbo].[Users] u
    )
    INSERT INTO [dbo].[UserRoles] ([UserId], [RoleId])
    SELECT m.UserId, r.Id
    FROM MapRole m
    JOIN [dbo].[Roles] r ON r.[Name] = m.RoleName
    WHERE NOT EXISTS (
        SELECT 1
        FROM [dbo].[UserRoles] ur
        WHERE ur.[UserId] = m.UserId AND ur.[RoleId] = r.Id
    );

    -- Giữ lại cột Role để rollback nếu cần.
    -- Khi đã ổn định production, có thể DROP COLUMN [Role].
END
GO

-- 5) Với user chưa có role nào, gán mặc định Customer
INSERT INTO [dbo].[UserRoles] ([UserId], [RoleId])
SELECT u.[Id], r.[Id]
FROM [dbo].[Users] u
CROSS JOIN (SELECT [Id] FROM [dbo].[Roles] WHERE [Name] = N'Customer') r
WHERE NOT EXISTS (
    SELECT 1 FROM [dbo].[UserRoles] ur WHERE ur.[UserId] = u.[Id]
);
GO
