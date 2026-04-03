namespace DTO;

public record LoginRequest(string Username, string Password);
public record LoginResponse(string AccessToken, string Username, string Role);
public record RegisterRequest(string Username, string Password, string FullName);
public record AssignUserRoleRequest(int UserId, string RoleName);
public record UserRoleItem(int RoleId, string RoleName);
public record UserWithRolesResponse(
    int UserId,
    string Username,
    string FullName,
    DateTime CreatedAt,
    string AccountStatus,
    List<UserRoleItem> Roles);
public record UserManagementQuery(int Page = 1, int PageSize = 10, string? Keyword = null, string? Role = null);
public record PagedUsersResponse(int Page, int PageSize, int Total, List<UserWithRolesResponse> Items);
public record CreateUserRequest(string Username, string Password, string FullName, List<string>? Roles);
public record UpdateUserRequest(int UserId, string Username, string FullName, string? Password);
public record UpdateUserStatusRequest(int UserId, string Status);

public record MovieRequest(string Name, string Genre, int DurationMinutes, decimal Rating, string? PosterUrl = null);
public record RateMovieRequest(int Stars);
public record MovieDetailResponse(
    int Id,
    string Name,
    string Genre,
    int DurationMinutes,
    decimal Rating,
    string? PosterUrl,
    double AverageUserStars,
    int UserRatingCount,
    int? MyStars);
public record ShowtimeRequest(int MovieId, int AuditoriumId, DateTime StartTime, decimal Price);
public record CreateAuditoriumRequest(string Name, int Capacity, List<string> SeatCodes);
public record UpdateAuditoriumRequest(string Name, int Capacity);
public record AddSeatRequest(string SeatCode, bool IsVip = false);
public record UpdateSeatRequest(string SeatCode, bool IsVip);
/// <param name="RowIndex">0 = hàng A, 1 = B, …</param>
public record AddSeatsByRowRequest(int RowIndex, int StartNumber, int Count, bool IsVip);
public record BulkSetSeatVipRequest(List<int> SeatIds, bool IsVip);

public record CreateReservationRequest(int ShowtimeId, List<int> SeatIds, int? TargetUserId = null);
public record ReservationResult(int ReservationId, decimal TotalAmount, List<string> TicketQrs);

public record MyReservationTicketDto(string SeatCode, string QrCode, bool CheckedIn);
public record MyReservationDto(
    int Id,
    string Status,
    string MovieName,
    DateTime StartTime,
    string AuditoriumName,
    decimal TotalAmount,
    IReadOnlyList<string> SeatCodes,
    IReadOnlyList<MyReservationTicketDto> Tickets,
    bool CanCancel,
    bool CanPay);

public record PendingReservationAdminDto(
    int Id,
    string CustomerUsername,
    string CustomerFullName,
    string MovieName,
    DateTime StartTime,
    string AuditoriumName,
    decimal TotalAmount,
    IReadOnlyList<string> SeatCodes,
    DateTime CreatedAt);

public record CustomerLookupDto(int UserId, string Username, string FullName);

public record PayReservationRequest(int ReservationId, string Method);
public record CheckInRequest(string QrCode);

public record MovieRevenueItem(int MovieId, string MovieName, decimal Revenue, int TicketsSold);

public record RevenueReportResult(
    decimal TotalRevenue,
    int TicketsSold,
    List<PopularShowtimeItem> PopularShowtimes,
    List<MovieRevenueItem> RevenueByMovie);

public record PopularShowtimeItem(int ShowtimeId, string MovieName, DateTime StartTime, int SoldTickets);
