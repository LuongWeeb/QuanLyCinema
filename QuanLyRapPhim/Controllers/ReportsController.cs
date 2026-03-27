using BUS;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace QuanLyRapPhim.Controllers;

[ApiController]
[Route("api/bao-cao")]
[Authorize(Roles = "Admin,Staff")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("doanh-thu")]
    public async Task<IActionResult> Revenue([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        if (from > to)
        {
            return BadRequest(new { message = "Khoảng thời gian không hợp lệ." });
        }

        var result = await _reportService.GetRevenueReportAsync(from, to);
        return Ok(result);
    }
}
