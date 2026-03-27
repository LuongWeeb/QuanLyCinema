using BUS;
using DTO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuanLyRapPhim.Extensions;

namespace QuanLyRapPhim.Controllers;

[ApiController]
[Route("api/dat-ve")]
[Authorize]
public class ReservationsController : ControllerBase
{
    private readonly IReservationService _reservationService;

    public ReservationsController(IReservationService reservationService)
    {
        _reservationService = reservationService;
    }

    [HttpPost]
    [Authorize(Roles = "Customer,Staff,Admin")]
    public async Task<IActionResult> Reserve([FromBody] CreateReservationRequest request)
    {
        var userId = User.GetUserId();
        try
        {
            var result = await _reservationService.CreateReservationAsync(userId, request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("thanh-toan")]
    [Authorize(Roles = "Customer,Staff,Admin")]
    public async Task<IActionResult> Pay([FromBody] PayReservationRequest request)
    {
        var userId = User.GetUserId();
        var ok = await _reservationService.PayReservationAsync(userId, request);
        return ok ? Ok(new { message = "Thanh toán thành công." }) : BadRequest(new { message = "Không thể thanh toán." });
    }

    [HttpPost("check-in-ve")]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<IActionResult> CheckIn([FromBody] CheckInRequest request)
    {
        var ok = await _reservationService.CheckInAsync(request);
        return ok ? Ok(new { message = "Check-in thành công." }) : BadRequest(new { message = "Vé không hợp lệ hoặc đã check-in." });
    }
}
