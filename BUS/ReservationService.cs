using DAL;
using DTO;
using Microsoft.EntityFrameworkCore;

namespace BUS;

public interface IReservationService
{
    Task<ReservationResult> CreateReservationAsync(int userId, CreateReservationRequest request, bool allowAssignTargetUser);
    Task<bool> PayReservationAsync(int userId, PayReservationRequest request, bool staffOrAdmin);
    Task<bool> CheckInAsync(CheckInRequest request);
    Task<IReadOnlyList<MyReservationDto>> GetMyReservationsAsync(int userId);
    Task<(bool Ok, string? Message)> CancelReservationAsync(int userId, int reservationId);
    Task<IReadOnlyList<PendingReservationAdminDto>> GetPendingApprovalsAsync();
    Task<IReadOnlyList<PendingReservationAdminDto>> GetAwaitingPaymentAsync();
    Task<(bool Ok, string? Message)> ApproveReservationAsync(int reservationId);
    Task<(bool Ok, string? Message)> RejectReservationAsync(int reservationId);
}

public class ReservationService : IReservationService
{
    private readonly CinemaDbContext _db;

    public ReservationService(CinemaDbContext db)
    {
        _db = db;
    }

    public async Task<ReservationResult> CreateReservationAsync(int userId, CreateReservationRequest request, bool allowAssignTargetUser)
    {
        var showtime = await _db.Showtimes
            .Include(x => x.Auditorium)
            .FirstOrDefaultAsync(x => x.Id == request.ShowtimeId);
        if (showtime is null)
        {
            throw new InvalidOperationException("Suất chiếu không tồn tại.");
        }

        if (request.SeatIds.Count == 0)
        {
            throw new InvalidOperationException("Phải chọn ít nhất 1 ghế.");
        }

        var reservationUserId = userId;
        if (request.TargetUserId is int tid && tid > 0)
        {
            if (!allowAssignTargetUser)
            {
                throw new InvalidOperationException("Không được đặt vé thay cho khách hàng.");
            }

            var targetOk = await _db.Users.AnyAsync(u => u.Id == tid && !u.IsLocked);
            if (!targetOk)
            {
                throw new InvalidOperationException("Khách hàng không tồn tại hoặc đã bị khóa.");
            }

            reservationUserId = tid;
        }

        await using var tx = await _db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        var seats = await _db.Seats
            .Where(s => s.AuditoriumId == showtime.AuditoriumId && request.SeatIds.Contains(s.Id))
            .ToListAsync();

        if (seats.Count != request.SeatIds.Count)
        {
            throw new InvalidOperationException("Danh sách ghế không hợp lệ.");
        }

        var lockedSeatIds = await _db.Tickets
            .Where(t => t.ShowtimeId == showtime.Id && request.SeatIds.Contains(t.SeatId))
            .Select(t => t.SeatId)
            .ToListAsync();

        if (lockedSeatIds.Count > 0)
        {
            throw new InvalidOperationException($"Ghế đã được đặt: {string.Join(",", lockedSeatIds)}");
        }

        var reservation = new Reservation
        {
            UserId = reservationUserId,
            ShowtimeId = showtime.Id,
            Status = ReservationStatus.PendingApproval
        };
        _db.Reservations.Add(reservation);
        await _db.SaveChangesAsync();

        var tickets = request.SeatIds.Select(seatId => new Ticket
        {
            ReservationId = reservation.Id,
            ShowtimeId = showtime.Id,
            SeatId = seatId,
            QrCode = Guid.NewGuid().ToString("N")
        }).ToList();
        _db.Tickets.AddRange(tickets);

        const decimal VipMultiplier = 1.5m;
        var total = seats.Sum(s => showtime.Price * (s.IsVip ? VipMultiplier : 1m));
        var invoice = new Invoice { ReservationId = reservation.Id, TotalAmount = total };
        _db.Invoices.Add(invoice);

        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return new ReservationResult(reservation.Id, total, tickets.Select(x => x.QrCode).ToList());
    }

    public async Task<bool> PayReservationAsync(int userId, PayReservationRequest request, bool staffOrAdmin)
    {
        var reservation = await _db.Reservations
            .FirstOrDefaultAsync(x => x.Id == request.ReservationId);
        if (reservation is null || reservation.Status != ReservationStatus.PendingPayment)
        {
            return false;
        }

        if (!staffOrAdmin && reservation.UserId != userId)
        {
            return false;
        }

        var invoice = await _db.Invoices.FirstAsync(x => x.ReservationId == reservation.Id);
        var payment = new Payment
        {
            InvoiceId = invoice.Id,
            Method = request.Method,
            Status = PaymentStatus.Success,
            PaidAt = DateTime.UtcNow
        };
        _db.Payments.Add(payment);
        reservation.Status = ReservationStatus.Paid;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CheckInAsync(CheckInRequest request)
    {
        var ticket = await _db.Tickets.FirstOrDefaultAsync(x => x.QrCode == request.QrCode);
        if (ticket is null || ticket.CheckedIn)
        {
            return false;
        }

        var reservation = await _db.Reservations.FirstAsync(x => x.Id == ticket.ReservationId);
        if (reservation.Status != ReservationStatus.Paid)
        {
            return false;
        }

        ticket.CheckedIn = true;
        ticket.CheckedInAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IReadOnlyList<MyReservationDto>> GetMyReservationsAsync(int userId)
    {
        var list = await _db.Reservations
            .AsNoTracking()
            .Where(r => r.UserId == userId)
            .Include(r => r.Showtime).ThenInclude(s => s.Movie)
            .Include(r => r.Showtime).ThenInclude(s => s.Auditorium)
            .Include(r => r.Tickets).ThenInclude(t => t.Seat)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var ids = list.Select(r => r.Id).ToList();
        var invoices = await _db.Invoices.AsNoTracking()
            .Where(i => ids.Contains(i.ReservationId))
            .ToDictionaryAsync(i => i.ReservationId, i => i.TotalAmount);

        var now = DateTime.UtcNow;
        var result = new List<MyReservationDto>(list.Count);
        foreach (var r in list)
        {
            var showtime = r.Showtime;
            var total = invoices.TryGetValue(r.Id, out var amt) ? amt : 0m;
            var ticketDtos = r.Tickets
                .OrderBy(x => x.Seat.SeatCode)
                .Select(x => new MyReservationTicketDto(x.Seat.SeatCode, x.QrCode, x.CheckedIn))
                .ToList();
            var seatCodes = ticketDtos.Select(x => x.SeatCode).ToList();
            var future = showtime.StartTime > now;
            var hasCheckedIn = r.Tickets.Any(x => x.CheckedIn);
            var canCancel = (r.Status == ReservationStatus.PendingApproval
                             || r.Status == ReservationStatus.PendingPayment
                             || r.Status == ReservationStatus.Paid)
                && !hasCheckedIn
                && future;
            var canPay = r.Status == ReservationStatus.PendingPayment && future && !hasCheckedIn;

            result.Add(new MyReservationDto(
                r.Id,
                r.Status.ToString(),
                showtime.Movie.Name,
                showtime.StartTime,
                showtime.Auditorium.Name,
                total,
                seatCodes,
                ticketDtos,
                canCancel,
                canPay));
        }

        return result;
    }

    public async Task<IReadOnlyList<PendingReservationAdminDto>> GetPendingApprovalsAsync()
    {
        var list = await _db.Reservations
            .AsNoTracking()
            .Where(r => r.Status == ReservationStatus.PendingApproval)
            .Include(r => r.User)
            .Include(r => r.Showtime).ThenInclude(s => s.Movie)
            .Include(r => r.Showtime).ThenInclude(s => s.Auditorium)
            .Include(r => r.Tickets).ThenInclude(t => t.Seat)
            .OrderBy(r => r.CreatedAt)
            .ToListAsync();

        var ids = list.Select(r => r.Id).ToList();
        var invoices = await _db.Invoices.AsNoTracking()
            .Where(i => ids.Contains(i.ReservationId))
            .ToDictionaryAsync(i => i.ReservationId, i => i.TotalAmount);

        return list.Select(r =>
        {
            var total = invoices.TryGetValue(r.Id, out var amt) ? amt : 0m;
            var seatCodes = r.Tickets.OrderBy(t => t.Seat.SeatCode).Select(t => t.Seat.SeatCode).ToList();
            return new PendingReservationAdminDto(
                r.Id,
                r.User.Username,
                r.User.FullName,
                r.Showtime.Movie.Name,
                r.Showtime.StartTime,
                r.Showtime.Auditorium.Name,
                total,
                seatCodes,
                r.CreatedAt);
        }).ToList();
    }

    public async Task<IReadOnlyList<PendingReservationAdminDto>> GetAwaitingPaymentAsync()
    {
        var list = await _db.Reservations
            .AsNoTracking()
            .Where(r => r.Status == ReservationStatus.PendingPayment)
            .Include(r => r.User)
            .Include(r => r.Showtime).ThenInclude(s => s.Movie)
            .Include(r => r.Showtime).ThenInclude(s => s.Auditorium)
            .Include(r => r.Tickets).ThenInclude(t => t.Seat)
            .OrderBy(r => r.Showtime.StartTime)
            .ToListAsync();

        var ids = list.Select(r => r.Id).ToList();
        var invoices = await _db.Invoices.AsNoTracking()
            .Where(i => ids.Contains(i.ReservationId))
            .ToDictionaryAsync(i => i.ReservationId, i => i.TotalAmount);

        return list.Select(r =>
        {
            var total = invoices.TryGetValue(r.Id, out var amt) ? amt : 0m;
            var seatCodes = r.Tickets.OrderBy(t => t.Seat.SeatCode).Select(t => t.Seat.SeatCode).ToList();
            return new PendingReservationAdminDto(
                r.Id,
                r.User.Username,
                r.User.FullName,
                r.Showtime.Movie.Name,
                r.Showtime.StartTime,
                r.Showtime.Auditorium.Name,
                total,
                seatCodes,
                r.CreatedAt);
        }).ToList();
    }

    public async Task<(bool Ok, string? Message)> ApproveReservationAsync(int reservationId)
    {
        var r = await _db.Reservations.FirstOrDefaultAsync(x => x.Id == reservationId);
        if (r is null)
        {
            return (false, "Không tìm thấy đặt chỗ.");
        }

        if (r.Status != ReservationStatus.PendingApproval)
        {
            return (false, "Đơn không ở trạng thái chờ duyệt.");
        }

        if (await _db.Showtimes.AsNoTracking().AnyAsync(s => s.Id == r.ShowtimeId && s.StartTime <= DateTime.UtcNow))
        {
            return (false, "Suất chiếu đã bắt đầu, không thể duyệt.");
        }

        r.Status = ReservationStatus.PendingPayment;
        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Ok, string? Message)> RejectReservationAsync(int reservationId)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        var r = await _db.Reservations
            .Include(x => x.Tickets)
            .FirstOrDefaultAsync(x => x.Id == reservationId);

        if (r is null)
        {
            return (false, "Không tìm thấy đặt chỗ.");
        }

        if (r.Status != ReservationStatus.PendingApproval && r.Status != ReservationStatus.PendingPayment)
        {
            return (false, "Chỉ có thể từ chối đơn chưa thanh toán.");
        }

        if (r.Tickets.Count > 0 && r.Tickets.Any(t => t.CheckedIn))
        {
            return (false, "Không thể từ chối vé đã check-in.");
        }

        var invoice = await _db.Invoices.FirstOrDefaultAsync(i => i.ReservationId == r.Id);
        if (invoice is not null)
        {
            var pays = await _db.Payments.Where(p => p.InvoiceId == invoice.Id).ToListAsync();
            if (pays.Count > 0)
            {
                return (false, "Đơn đã có thanh toán, không thể từ chối.");
            }
        }

        var tickets = await _db.Tickets.Where(t => t.ReservationId == r.Id).ToListAsync();
        _db.Tickets.RemoveRange(tickets);

        if (invoice is not null)
        {
            _db.Invoices.Remove(invoice);
        }

        r.Status = ReservationStatus.Cancelled;
        await _db.SaveChangesAsync();
        await tx.CommitAsync();
        return (true, null);
    }

    public async Task<(bool Ok, string? Message)> CancelReservationAsync(int userId, int reservationId)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        var r = await _db.Reservations
            .Include(x => x.Tickets)
            .Include(x => x.Showtime)
            .FirstOrDefaultAsync(x => x.Id == reservationId && x.UserId == userId);

        if (r is null)
        {
            return (false, "Không tìm thấy đặt chỗ.");
        }

        if (r.Status == ReservationStatus.Cancelled)
        {
            return (false, "Đặt chỗ đã được hủy trước đó.");
        }

        if (r.Tickets.Count > 0 && r.Tickets.Any(t => t.CheckedIn))
        {
            return (false, "Không thể hủy vé đã check-in.");
        }

        if (r.Showtime.StartTime <= DateTime.UtcNow)
        {
            return (false, "Không thể hủy suất chiếu đã bắt đầu hoặc đã qua.");
        }

        if (r.Status != ReservationStatus.PendingApproval
            && r.Status != ReservationStatus.PendingPayment
            && r.Status != ReservationStatus.Paid)
        {
            return (false, "Trạng thái đặt chỗ không cho phép hủy.");
        }

        var tickets = await _db.Tickets.Where(t => t.ReservationId == r.Id).ToListAsync();
        _db.Tickets.RemoveRange(tickets);

        var invoice = await _db.Invoices.FirstOrDefaultAsync(i => i.ReservationId == r.Id);
        if (invoice is not null)
        {
            var pays = await _db.Payments.Where(p => p.InvoiceId == invoice.Id).ToListAsync();
            _db.Payments.RemoveRange(pays);
            _db.Invoices.Remove(invoice);
        }

        r.Status = ReservationStatus.Cancelled;
        await _db.SaveChangesAsync();
        await tx.CommitAsync();
        return (true, null);
    }
}
