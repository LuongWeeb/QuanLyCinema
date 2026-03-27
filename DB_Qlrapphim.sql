CREATE DATABASE WebQuanLyRapPhim;
GO

USE WebQuanLyRapPhim;
GO

CREATE TABLE TaiKhoan (
    MaTaiKhoan INT IDENTITY(1,1) PRIMARY KEY,
    TenDangNhap VARCHAR(50) NOT NULL UNIQUE,
    MatKhau VARCHAR(100) NOT NULL,
    VaiTro NVARCHAR(20) NOT NULL DEFAULT N'Admin'
);
GO

CREATE TABLE Phim (
    MaPhim INT IDENTITY(1,1) PRIMARY KEY,
    TenPhim NVARCHAR(200) NOT NULL,
    TheLoai NVARCHAR(100),
    ThoiLuong INT NOT NULL,
    NgayKhoiChieu DATE,
    MoTa NVARCHAR(MAX),
    HinhAnh NVARCHAR(255),
    TrangThai NVARCHAR(30) NOT NULL DEFAULT N'Đang chiếu'
);
GO

CREATE TABLE PhongChieu (
    MaPhong INT IDENTITY(1,1) PRIMARY KEY,
    TenPhong NVARCHAR(50) NOT NULL,
    SoLuongGhe INT NOT NULL,
    TrangThai NVARCHAR(30) NOT NULL DEFAULT N'Hoạt động'
);
GO

CREATE TABLE Ghe (
    MaGhe INT IDENTITY(1,1) PRIMARY KEY,
    MaPhong INT NOT NULL,
    TenGhe NVARCHAR(10) NOT NULL,
    LoaiGhe NVARCHAR(20) NOT NULL DEFAULT N'Thường',
    FOREIGN KEY (MaPhong) REFERENCES PhongChieu(MaPhong)
);
GO

CREATE TABLE LichChieu (
    MaLichChieu INT IDENTITY(1,1) PRIMARY KEY,
    MaPhim INT NOT NULL,
    MaPhong INT NOT NULL,
    NgayChieu DATE NOT NULL,
    GioChieu TIME NOT NULL,
    GiaVe DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (MaPhim) REFERENCES Phim(MaPhim),
    FOREIGN KEY (MaPhong) REFERENCES PhongChieu(MaPhong)
);
GO

CREATE TABLE KhachHang (
    MaKhachHang INT IDENTITY(1,1) PRIMARY KEY,
    HoTen NVARCHAR(100) NOT NULL,
    SoDienThoai VARCHAR(15),
    Email VARCHAR(100)
);
GO

CREATE TABLE Ve (
    MaVe INT IDENTITY(1,1) PRIMARY KEY,
    MaKhachHang INT NOT NULL,
    MaLichChieu INT NOT NULL,
    MaGhe INT NOT NULL,
    NgayDat DATETIME NOT NULL DEFAULT GETDATE(),
    TrangThai NVARCHAR(30) NOT NULL DEFAULT N'Đã đặt',
    FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang),
    FOREIGN KEY (MaLichChieu) REFERENCES LichChieu(MaLichChieu),
    FOREIGN KEY (MaGhe) REFERENCES Ghe(MaGhe)
);
GO

ALTER TABLE Ve
ADD CONSTRAINT UQ_Ve_MaLichChieu_MaGhe UNIQUE (MaLichChieu, MaGhe);
GO

INSERT INTO TaiKhoan (TenDangNhap, MatKhau, VaiTro)
VALUES
('admin', '123456', N'Admin'),
('nhanvien1', '123456', N'NhanVien');
GO

INSERT INTO Phim (TenPhim, TheLoai, ThoiLuong, NgayKhoiChieu, MoTa, HinhAnh, TrangThai)
VALUES
(N'Avengers: Endgame', N'Hành động', 181, '2026-03-01', N'Phim siêu anh hùng Marvel', 'avengers.jpg', N'Đang chiếu'),
(N'Doraemon Movie', N'Hoạt hình', 100, '2026-03-05', N'Phim hoạt hình dành cho gia đình', 'doraemon.jpg', N'Đang chiếu');
GO

INSERT INTO PhongChieu (TenPhong, SoLuongGhe, TrangThai)
VALUES
(N'Phòng 1', 20, N'Hoạt động'),
(N'Phòng 2', 25, N'Hoạt động');
GO

INSERT INTO Ghe (MaPhong, TenGhe, LoaiGhe)
VALUES
(1, 'A1', N'Thường'),
(1, 'A2', N'Thường'),
(1, 'A3', N'VIP'),
(1, 'A4', N'VIP'),
(2, 'B1', N'Thường'),
(2, 'B2', N'Thường');
GO

INSERT INTO LichChieu (MaPhim, MaPhong, NgayChieu, GioChieu, GiaVe)
VALUES
(1, 1, '2026-03-28', '18:00:00', 90000),
(2, 2, '2026-03-28', '20:00:00', 80000);
GO

INSERT INTO KhachHang (HoTen, SoDienThoai, Email)
VALUES
(N'Nguyễn Văn A', '0909123456', 'a@gmail.com'),
(N'Trần Thị B', '0911222333', 'b@gmail.com');
GO

INSERT INTO Ve (MaKhachHang, MaLichChieu, MaGhe, TrangThai)
VALUES
(1, 1, 1, N'Đã đặt'),
(2, 2, 5, N'Đã đặt');
GO

CREATE PROCEDURE sp_ThemPhim
    @TenPhim NVARCHAR(200),
    @TheLoai NVARCHAR(100),
    @ThoiLuong INT,
    @NgayKhoiChieu DATE,
    @MoTa NVARCHAR(MAX),
    @HinhAnh NVARCHAR(255),
    @TrangThai NVARCHAR(30)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Phim (TenPhim, TheLoai, ThoiLuong, NgayKhoiChieu, MoTa, HinhAnh, TrangThai)
    VALUES (@TenPhim, @TheLoai, @ThoiLuong, @NgayKhoiChieu, @MoTa, @HinhAnh, @TrangThai);
END;
GO

CREATE PROCEDURE sp_SuaPhim
    @MaPhim INT,
    @TenPhim NVARCHAR(200),
    @TheLoai NVARCHAR(100),
    @ThoiLuong INT,
    @NgayKhoiChieu DATE,
    @MoTa NVARCHAR(MAX),
    @HinhAnh NVARCHAR(255),
    @TrangThai NVARCHAR(30)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Phim
    SET
        TenPhim = @TenPhim,
        TheLoai = @TheLoai,
        ThoiLuong = @ThoiLuong,
        NgayKhoiChieu = @NgayKhoiChieu,
        MoTa = @MoTa,
        HinhAnh = @HinhAnh,
        TrangThai = @TrangThai
    WHERE MaPhim = @MaPhim;
END;
GO

CREATE PROCEDURE sp_XoaPhim
    @MaPhim INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM Phim
    WHERE MaPhim = @MaPhim;
END;
GO

CREATE PROCEDURE sp_ThemLichChieu
    @MaPhim INT,
    @MaPhong INT,
    @NgayChieu DATE,
    @GioChieu TIME,
    @GiaVe DECIMAL(18,2)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO LichChieu (MaPhim, MaPhong, NgayChieu, GioChieu, GiaVe)
    VALUES (@MaPhim, @MaPhong, @NgayChieu, @GioChieu, @GiaVe);
END;
GO

CREATE PROCEDURE sp_TimPhimTheoTen
    @TuKhoa NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM Phim
    WHERE TenPhim LIKE N'%' + @TuKhoa + N'%';
END;
GO

CREATE PROCEDURE sp_DanhSachLichChieu
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        lc.MaLichChieu,
        p.TenPhim,
        pc.TenPhong,
        lc.NgayChieu,
        lc.GioChieu,
        lc.GiaVe
    FROM LichChieu lc
    INNER JOIN Phim p ON lc.MaPhim = p.MaPhim
    INNER JOIN PhongChieu pc ON lc.MaPhong = pc.MaPhong
    ORDER BY lc.NgayChieu, lc.GioChieu;
END;
GO

CREATE PROCEDURE sp_DatVe
    @MaKhachHang INT,
    @MaLichChieu INT,
    @MaGhe INT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM Ve
        WHERE MaLichChieu = @MaLichChieu
          AND MaGhe = @MaGhe
    )
    BEGIN
        RAISERROR (N'Ghế này đã được đặt rồi!', 16, 1);
        RETURN;
    END

    INSERT INTO Ve (MaKhachHang, MaLichChieu, MaGhe, NgayDat, TrangThai)
    VALUES (@MaKhachHang, @MaLichChieu, @MaGhe, GETDATE(), N'Đã đặt');
END;
GO

CREATE PROCEDURE sp_DanhSachVe
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        v.MaVe,
        kh.HoTen,
        p.TenPhim,
        pc.TenPhong,
        g.TenGhe,
        lc.NgayChieu,
        lc.GioChieu,
        v.NgayDat,
        v.TrangThai
    FROM Ve v
    INNER JOIN KhachHang kh ON v.MaKhachHang = kh.MaKhachHang
    INNER JOIN LichChieu lc ON v.MaLichChieu = lc.MaLichChieu
    INNER JOIN Phim p ON lc.MaPhim = p.MaPhim
    INNER JOIN PhongChieu pc ON lc.MaPhong = pc.MaPhong
    INNER JOIN Ghe g ON v.MaGhe = g.MaGhe
    ORDER BY v.NgayDat DESC;
END;
GO