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
        var ticketsSold = await _db.Tickets.CountAsync(t => reservationIds.Contains(t.ReservationId));

        var popularShowtimes = await _db.Tickets
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

        return new RevenueReportResult(totalRevenue, ticketsSold, popularShowtimes);
    }
}
