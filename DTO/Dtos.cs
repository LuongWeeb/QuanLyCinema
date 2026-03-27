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

public record MovieRequest(string Name, string Genre, int DurationMinutes, decimal Rating);
public record ShowtimeRequest(int MovieId, int AuditoriumId, DateTime StartTime, decimal Price);
public record CreateAuditoriumRequest(string Name, int Capacity, List<string> SeatCodes);

public record CreateReservationRequest(int ShowtimeId, List<int> SeatIds);
public record ReservationResult(int ReservationId, decimal TotalAmount, List<string> TicketQrs);

public record PayReservationRequest(int ReservationId, string Method);
public record CheckInRequest(string QrCode);

public record RevenueReportResult(decimal TotalRevenue, int TicketsSold, List<PopularShowtimeItem> PopularShowtimes);
public record PopularShowtimeItem(int ShowtimeId, string MovieName, DateTime StartTime, int SoldTickets);
