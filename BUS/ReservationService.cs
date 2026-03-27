using DAL;
using DTO;
using Microsoft.EntityFrameworkCore;

namespace BUS;

public interface IReservationService
{
    Task<ReservationResult> CreateReservationAsync(int userId, CreateReservationRequest request);
    Task<bool> PayReservationAsync(int userId, PayReservationRequest request);
    Task<bool> CheckInAsync(CheckInRequest request);
}

public class ReservationService : IReservationService
{
    private readonly CinemaDbContext _db;

    public ReservationService(CinemaDbContext db)
    {
        _db = db;
    }

    public async Task<ReservationResult> CreateReservationAsync(int userId, CreateReservationRequest request)
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
            UserId = userId,
            ShowtimeId = showtime.Id,
            Status = ReservationStatus.Pending
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

        var total = showtime.Price * request.SeatIds.Count;
        var invoice = new Invoice { ReservationId = reservation.Id, TotalAmount = total };
        _db.Invoices.Add(invoice);

        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return new ReservationResult(reservation.Id, total, tickets.Select(x => x.QrCode).ToList());
    }

    public async Task<bool> PayReservationAsync(int userId, PayReservationRequest request)
    {
        var reservation = await _db.Reservations
            .FirstOrDefaultAsync(x => x.Id == request.ReservationId && x.UserId == userId);
        if (reservation is null || reservation.Status != ReservationStatus.Pending)
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
}
