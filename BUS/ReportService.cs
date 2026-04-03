using DAL;
using DTO;
using Microsoft.EntityFrameworkCore;

namespace BUS;

public interface IReportService
{
    Task<RevenueReportResult> GetRevenueReportAsync(DateTime from, DateTime to);
}

public class ReportService : IReportService
{
    private readonly CinemaDbContext _db;

    public ReportService(CinemaDbContext db)
    {
        _db = db;
    }

    public async Task<RevenueReportResult> GetRevenueReportAsync(DateTime from, DateTime to)
    {
        var query = _db.Payments
            .Where(p => p.Status == PaymentStatus.Success && p.PaidAt >= from && p.PaidAt <= to)
            .Include(p => p.Invoice);

        var totalRevenue = await query.SumAsync(x => x.Invoice.TotalAmount);
        var invoiceIds = await query.Select(x => x.InvoiceId).ToListAsync();
        var reservationIds = await _db.Invoices.Where(i => invoiceIds.Contains(i.Id)).Select(i => i.ReservationId).ToListAsync();
        var ticketsSold = reservationIds.Count == 0
            ? 0
            : await _db.Tickets.CountAsync(t => reservationIds.Contains(t.ReservationId));

        var popularShowtimes = reservationIds.Count == 0
            ? new List<PopularShowtimeItem>()
            : await _db.Tickets
                .Where(t => reservationIds.Contains(t.ReservationId))
                .GroupBy(t => t.ShowtimeId)
                .Select(g => new { ShowtimeId = g.Key, SoldTickets = g.Count() })
                .OrderByDescending(x => x.SoldTickets)
                .Take(5)
                .Join(_db.Showtimes.Include(s => s.Movie),
                    g => g.ShowtimeId,
                    s => s.Id,
                    (g, s) => new PopularShowtimeItem(s.Id, s.Movie.Name, s.StartTime, g.SoldTickets))
                .ToListAsync();

        var paymentsData = await _db.Payments
            .AsNoTracking()
            .Where(p => p.Status == PaymentStatus.Success && p.PaidAt >= from && p.PaidAt <= to)
            .Select(p => new
            {
                MovieId = p.Invoice.Reservation.Showtime.MovieId,
                MovieName = p.Invoice.Reservation.Showtime.Movie.Name,
                Amount = p.Invoice.TotalAmount,
                ReservationId = p.Invoice.ReservationId
            })
            .ToListAsync();

        var revenueByMovieGroups = paymentsData
            .GroupBy(x => new { x.MovieId, x.MovieName })
            .Select(g => new { g.Key.MovieId, g.Key.MovieName, Revenue = g.Sum(x => x.Amount) })
            .OrderByDescending(x => x.Revenue)
            .ToList();

        var resIdsDistinct = paymentsData.Select(x => x.ReservationId).Distinct().ToList();
        Dictionary<int, int> ticketsByMovie = new();
        if (resIdsDistinct.Count > 0)
        {
            var ticketMovieIds = await _db.Tickets
                .AsNoTracking()
                .Where(t => resIdsDistinct.Contains(t.ReservationId))
                .Select(t => t.Showtime.MovieId)
                .ToListAsync();
            ticketsByMovie = ticketMovieIds
                .GroupBy(mid => mid)
                .ToDictionary(g => g.Key, g => g.Count());
        }

        var revenueByMovie = revenueByMovieGroups
            .Select(x => new MovieRevenueItem(
                x.MovieId,
                x.MovieName,
                x.Revenue,
                ticketsByMovie.GetValueOrDefault(x.MovieId, 0)))
            .ToList();

        return new RevenueReportResult(totalRevenue, ticketsSold, popularShowtimes, revenueByMovie);
    }
}
