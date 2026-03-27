/*
    DB_Qlrapphim.sql
    Script tao moi database theo dung schema API hien tai (DTO/DAL/BUS).
    Co ho tro xoa DB neu da ton tai.
*/

USE master;
GO


CREATE DATABASE [WebQuanLyRapPhim];
GO

USE [WebQuanLyRapPhim];
GO

-- Users
CREATE TABLE [dbo].[Users]
(
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Username] NVARCHAR(450) NOT NULL,
    [PasswordHash] NVARCHAR(MAX) NOT NULL,
    [Role] INT NOT NULL, -- 1=Admin, 2=Staff, 3=Customer
    [FullName] NVARCHAR(MAX) NOT NULL
);
GO

CREATE UNIQUE INDEX [IX_Users_Username] ON [dbo].[Users]([Username]);
GO

-- Movies
CREATE TABLE [dbo].[Movies]
(
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Name] NVARCHAR(MAX) NOT NULL,
    [Genre] NVARCHAR(MAX) NOT NULL,
    [DurationMinutes] INT NOT NULL,
    [Rating] DECIMAL(18,2) NOT NULL
);
GO

-- Auditoriums
CREATE TABLE [dbo].[Auditoriums]
(
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Name] NVARCHAR(MAX) NOT NULL,
    [Capacity] INT NOT NULL
);
GO

-- Seats
CREATE TABLE [dbo].[Seats]
(
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [AuditoriumId] INT NOT NULL,
    [SeatCode] NVARCHAR(450) NOT NULL,
    CONSTRAINT [FK_Seats_Auditoriums_AuditoriumId]
        FOREIGN KEY ([AuditoriumId]) REFERENCES [dbo].[Auditoriums]([Id])
);
GO

CREATE UNIQUE INDEX [IX_Seats_AuditoriumId_SeatCode]
    ON [dbo].[Seats]([AuditoriumId], [SeatCode]);
GO

-- Showtimes
CREATE TABLE [dbo].[Showtimes]
(
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [MovieId] INT NOT NULL,
    [AuditoriumId] INT NOT NULL,
    [StartTime] DATETIME2(7) NOT NULL,
    [Price] DECIMAL(18,2) NOT NULL,
    CONSTRAINT [FK_Showtimes_Movies_MovieId]
        FOREIGN KEY ([MovieId]) REFERENCES [dbo].[Movies]([Id]),
    CONSTRAINT [FK_Showtimes_Auditoriums_AuditoriumId]
        FOREIGN KEY ([AuditoriumId]) REFERENCES [dbo].[Auditoriums]([Id])
);
GO

-- Reservations
CREATE TABLE [dbo].[Reservations]
(
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [UserId] INT NOT NULL,
    [ShowtimeId] INT NOT NULL,
    [Status] INT NOT NULL DEFAULT (1), -- 1=Pending, 2=Paid, 3=Cancelled
    [CreatedAt] DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [FK_Reservations_Users_UserId]
        FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]),
    CONSTRAINT [FK_Reservations_Showtimes_ShowtimeId]
        FOREIGN KEY ([ShowtimeId]) REFERENCES [dbo].[Showtimes]([Id])
);
GO

-- Tickets
CREATE TABLE [dbo].[Tickets]
(
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ReservationId] INT NOT NULL,
    [ShowtimeId] INT NOT NULL,
    [SeatId] INT NOT NULL,
    [QrCode] NVARCHAR(450) NOT NULL,
    [CheckedIn] BIT NOT NULL DEFAULT (0),
    [CheckedInAt] DATETIME2(7) NULL,
    CONSTRAINT [FK_Tickets_Reservations_ReservationId]
        FOREIGN KEY ([ReservationId]) REFERENCES [dbo].[Reservations]([Id]),
    CONSTRAINT [FK_Tickets_Showtimes_ShowtimeId]
        FOREIGN KEY ([ShowtimeId]) REFERENCES [dbo].[Showtimes]([Id]),
    CONSTRAINT [FK_Tickets_Seats_SeatId]
        FOREIGN KEY ([SeatId]) REFERENCES [dbo].[Seats]([Id])
);
GO

CREATE UNIQUE INDEX [IX_Tickets_ReservationId_SeatId]
    ON [dbo].[Tickets]([ReservationId], [SeatId]);
GO
CREATE UNIQUE INDEX [IX_Tickets_ShowtimeId_SeatId]
    ON [dbo].[Tickets]([ShowtimeId], [SeatId]);
GO
CREATE UNIQUE INDEX [IX_Tickets_QrCode]
    ON [dbo].[Tickets]([QrCode]);
GO

-- Invoices
CREATE TABLE [dbo].[Invoices]
(
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ReservationId] INT NOT NULL,
    [TotalAmount] DECIMAL(18,2) NOT NULL,
    [CreatedAt] DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [FK_Invoices_Reservations_ReservationId]
        FOREIGN KEY ([ReservationId]) REFERENCES [dbo].[Reservations]([Id])
);
GO

-- Payments
CREATE TABLE [dbo].[Payments]
(
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [InvoiceId] INT NOT NULL,
    [Status] INT NOT NULL DEFAULT (1), -- 1=Pending, 2=Success, 3=Failed
    [Method] NVARCHAR(MAX) NOT NULL,
    [PaidAt] DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [FK_Payments_Invoices_InvoiceId]
        FOREIGN KEY ([InvoiceId]) REFERENCES [dbo].[Invoices]([Id])
);
GO

-- Seed default users (password 123456, SHA256 uppercase hex)
INSERT INTO [dbo].[Users] ([Username], [PasswordHash], [Role], [FullName])
VALUES
    (N'admin',    N'8D969EEF6ECAD3C29A3A629280E686CF0C3F5D5A86AFF3CA12020C923ADC6C92', 1, N'System Admin'),
    (N'staff',    N'8D969EEF6ECAD3C29A3A629280E686CF0C3F5D5A86AFF3CA12020C923ADC6C92', 2, N'Ticket Staff'),
    (N'customer', N'8D969EEF6ECAD3C29A3A629280E686CF0C3F5D5A86AFF3CA12020C923ADC6C92', 3, N'Default Customer');
GO

-- Seed basic master data
INSERT INTO [dbo].[Movies] ([Name], [Genre], [DurationMinutes], [Rating])
VALUES
    (N'Avengers: Endgame', N'Action', 181, 8.40),
    (N'Doraemon Movie', N'Animation', 100, 7.80);
GO

INSERT INTO [dbo].[Auditoriums] ([Name], [Capacity])
VALUES
    (N'Phong 1', 6),
    (N'Phong 2', 6);
GO

INSERT INTO [dbo].[Seats] ([AuditoriumId], [SeatCode])
VALUES
    (1, N'A1'), (1, N'A2'), (1, N'A3'),
    (1, N'B1'), (1, N'B2'), (1, N'B3'),
    (2, N'A1'), (2, N'A2'), (2, N'A3'),
    (2, N'B1'), (2, N'B2'), (2, N'B3');
GO

INSERT INTO [dbo].[Showtimes] ([MovieId], [AuditoriumId], [StartTime], [Price])
VALUES
    (1, 1, DATEADD(HOUR, 2, SYSUTCDATETIME()), 90000),
    (2, 2, DATEADD(HOUR, 4, SYSUTCDATETIME()), 80000);
GO