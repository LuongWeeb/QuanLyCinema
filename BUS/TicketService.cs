using DAL;
using Microsoft.EntityFrameworkCore;
using QRCoder;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace BUS;

public interface ITicketService
{
    Task<byte[]?> GenerateTicketPdfAsync(string qrCode);
}

public class TicketService : ITicketService
{
    private readonly CinemaDbContext _db;

    public TicketService(CinemaDbContext db)
    {
        _db = db;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<byte[]?> GenerateTicketPdfAsync(string qrCode)
    {
        var ticket = await _db.Tickets
            .Include(t => t.Seat)
            .Include(t => t.Reservation)
            .ThenInclude(r => r.Showtime)
            .ThenInclude(s => s.Movie)
            .FirstOrDefaultAsync(t => t.QrCode == qrCode);
        if (ticket is null)
        {
            return null;
        }

        using var qrGenerator = new QRCodeGenerator();
        using var qrData = qrGenerator.CreateQrCode(ticket.QrCode, QRCodeGenerator.ECCLevel.Q);
        var png = new PngByteQRCode(qrData).GetGraphic(8);

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(30);
                page.Content().Column(col =>
                {
                    col.Item().Text("VE XEM PHIM").FontSize(22).Bold();
                    col.Item().Text($"Phim: {ticket.Reservation.Showtime.Movie.Name}");
                    col.Item().Text($"Suất chiếu: {ticket.Reservation.Showtime.StartTime:yyyy-MM-dd HH:mm}");
                    col.Item().Text($"Ghe: {ticket.Seat.SeatCode}");
                    col.Item().Text($"QR: {ticket.QrCode}");
                    col.Item().PaddingTop(15).Image(png).FitWidth();
                });
            });
        }).GeneratePdf();
    }
}
