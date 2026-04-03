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
        var allowTarget = User.IsInRole("Staff") || User.IsInRole("Admin");
        try
        {
            var result = await _reservationService.CreateReservationAsync(userId, request, allowTarget);
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
        var staffOrAdmin = User.IsInRole("Staff") || User.IsInRole("Admin");
        var ok = await _reservationService.PayReservationAsync(userId, request, staffOrAdmin);
        return ok ? Ok(new { message = "Thanh toán thành công." }) : BadRequest(new { message = "Không thể thanh toán." });
    }

    [HttpPost("check-in-ve")]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<IActionResult> CheckIn([FromBody] CheckInRequest request)
    {
        var ok = await _reservationService.CheckInAsync(request);
        return ok ? Ok(new { message = "Check-in thành công." }) : BadRequest(new { message = "Vé không hợp lệ hoặc đã check-in." });
    }

    [HttpGet("cua-toi")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> MyReservations()
    {
        var userId = User.GetUserId();
        var list = await _reservationService.GetMyReservationsAsync(userId);
        return Ok(list);
    }

    [HttpPost("{reservationId:int}/huy")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> Cancel(int reservationId)
    {
        var userId = User.GetUserId();
        var (ok, msg) = await _reservationService.CancelReservationAsync(userId, reservationId);
        return ok
            ? Ok(new { message = "Đã hủy đặt chỗ. Các ghế đã được trả lại." })
            : BadRequest(new { message = msg ?? "Không thể hủy đặt chỗ." });
    }

    [HttpGet("cho-duyet")]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<IActionResult> PendingApprovals()
    {
        var list = await _reservationService.GetPendingApprovalsAsync();
        return Ok(list);
    }

    [HttpGet("cho-thanh-toan")]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<IActionResult> AwaitingPayment()
    {
        var list = await _reservationService.GetAwaitingPaymentAsync();
        return Ok(list);
    }

    [HttpPost("{reservationId:int}/duyet")]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<IActionResult> Approve(int reservationId)
    {
        var (ok, msg) = await _reservationService.ApproveReservationAsync(reservationId);
        return ok
            ? Ok(new { message = "Đã duyệt đơn. Khách có thể thanh toán." })
            : BadRequest(new { message = msg ?? "Không thể duyệt đơn." });
    }

    [HttpPost("{reservationId:int}/tu-choi")]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<IActionResult> Reject(int reservationId)
    {
        var (ok, msg) = await _reservationService.RejectReservationAsync(reservationId);
        return ok
            ? Ok(new { message = "Đã từ chối đơn và trả ghế." })
            : BadRequest(new { message = msg ?? "Không thể từ chối đơn." });
    }
}
