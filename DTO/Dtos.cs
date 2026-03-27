namespace DTO;

public record LoginRequest(string Username, string Password);
public record LoginResponse(string AccessToken, string Username, string Role);

public record MovieRequest(string Name, string Genre, int DurationMinutes, decimal Rating);
public record ShowtimeRequest(int MovieId, int AuditoriumId, DateTime StartTime, decimal Price);
public record CreateAuditoriumRequest(string Name, int Capacity, List<string> SeatCodes);

public record CreateReservationRequest(int ShowtimeId, List<int> SeatIds);
public record ReservationResult(int ReservationId, decimal TotalAmount, List<string> TicketQrs);

public record PayReservationRequest(int ReservationId, string Method);
public record CheckInRequest(string QrCode);

public record RevenueReportResult(decimal TotalRevenue, int TicketsSold, List<PopularShowtimeItem> PopularShowtimes);
public record PopularShowtimeItem(int ShowtimeId, string MovieName, DateTime StartTime, int SoldTickets);
