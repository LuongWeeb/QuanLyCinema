namespace DTO;

public enum SeatStatus
{
    Available = 1,
    Reserved = 2,
    Sold = 3
}

public enum ReservationStatus
{
    /// <summary>Đơn mới tạo, chờ quản lý/nhân viên duyệt.</summary>
    PendingApproval = 1,
    Paid = 2,
    Cancelled = 3,
    /// <summary>Đã duyệt, chờ khách thanh toán (online hoặc tại quầy).</summary>
    PendingPayment = 4
}

public enum PaymentStatus
{
    Pending = 1,
    Success = 2,
    Failed = 3
}

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsLocked { get; set; }
    public List<UserRole> UserRoles { get; set; } = new();
    public List<MovieRating> MovieRatings { get; set; } = new();
}

public class Role
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<UserRole> UserRoles { get; set; } = new();
}

public class UserRole
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int RoleId { get; set; }
    public Role Role { get; set; } = null!;
}

public class Movie
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Genre { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public decimal Rating { get; set; }
    public string? PosterUrl { get; set; }
    public List<MovieRating> MovieRatings { get; set; } = new();
}

public class MovieRating
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int MovieId { get; set; }
    public Movie Movie { get; set; } = null!;
    public byte Stars { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Auditorium
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public List<Seat> Seats { get; set; } = new();
}

public class Seat
{
    public int Id { get; set; }
    public int AuditoriumId { get; set; }
    public Auditorium Auditorium { get; set; } = null!;
    public string SeatCode { get; set; } = string.Empty;
    /// <summary>Giá vé ghế này = giá suất × 1,5 khi đặt chỗ.</summary>
    public bool IsVip { get; set; }
}

public class Showtime
{
    public int Id { get; set; }
    public int MovieId { get; set; }
    public Movie Movie { get; set; } = null!;
    public int AuditoriumId { get; set; }
    public Auditorium Auditorium { get; set; } = null!;
    public DateTime StartTime { get; set; }
    public decimal Price { get; set; }
}

public class Reservation
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int ShowtimeId { get; set; }
    public Showtime Showtime { get; set; } = null!;
    public ReservationStatus Status { get; set; } = ReservationStatus.PendingApproval;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<Ticket> Tickets { get; set; } = new();
}

public class Ticket
{
    public int Id { get; set; }
    public int ReservationId { get; set; }
    public Reservation Reservation { get; set; } = null!;
    public int ShowtimeId { get; set; }
    public Showtime Showtime { get; set; } = null!;
    public int SeatId { get; set; }
    public Seat Seat { get; set; } = null!;
    public string QrCode { get; set; } = Guid.NewGuid().ToString("N");
    public bool CheckedIn { get; set; }
    public DateTime? CheckedInAt { get; set; }
}

public class Invoice
{
    public int Id { get; set; }
    public int ReservationId { get; set; }
    public Reservation Reservation { get; set; } = null!;
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Payment
{
    public int Id { get; set; }
    public int InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string Method { get; set; } = "Online";
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;
}
