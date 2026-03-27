using BUS;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace QuanLyRapPhim.Controllers;

[ApiController]
[Route("api/ve")]
[Authorize]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;

    public TicketsController(ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    [HttpGet("{qrCode}/in-pdf")]
    [Authorize(Roles = "Customer,Staff,Admin")]
    public async Task<IActionResult> DownloadTicketPdf(string qrCode)
    {
        var bytes = await _ticketService.GenerateTicketPdfAsync(qrCode);
        if (bytes is null)
        {
            return NotFound();
        }

        return File(bytes, "application/pdf", $"ticket-{qrCode}.pdf");
    }
}
