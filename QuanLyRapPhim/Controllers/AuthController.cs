using BUS;
using DTO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuanLyRapPhim.Extensions;

namespace QuanLyRapPhim.Controllers;

[ApiController]
[Route("api/xac-thuc")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("dang-ky")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(request);
        return result.Success ? Ok(new { message = result.Message }) : BadRequest(new { message = result.Message });
    }

    [HttpPost("dang-nhap")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        if (result is null)
        {
            return Unauthorized(new { message = "Sai tài khoản hoặc mật khẩu." });
        }

        return Ok(result);
    }

    [HttpPost("tao-tai-khoan-mau")]
    public async Task<IActionResult> SeedUsers()
    {
        await _authService.SeedDefaultUsersAsync();
        return Ok(new { message = "Đã tạo user mẫu: admin/staff/customer (mật khẩu 123456)." });
    }

    [HttpGet("khach-hang-goi-y")]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<IActionResult> SearchCustomers([FromQuery] string? q, [FromQuery] int take = 30)
    {
        var list = await _authService.SearchCustomersAsync(q, take);
        return Ok(list);
    }

    [HttpGet("nguoi-dung-vai-tro")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetUsersWithRoles([FromQuery] UserManagementQuery query)
    {
        var data = await _authService.GetUsersWithRolesAsync(query);
        return Ok(data);
    }

    [HttpPost("quan-ly-nguoi-dung/tao")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        var result = await _authService.CreateUserAsync(request);
        return result.Success ? Ok(new { message = result.Message }) : BadRequest(new { message = result.Message });
    }

    [HttpPut("quan-ly-nguoi-dung/cap-nhat")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateUser([FromBody] UpdateUserRequest request)
    {
        var result = await _authService.UpdateUserAsync(request);
        return result.Success ? Ok(new { message = result.Message }) : BadRequest(new { message = result.Message });
    }

    [HttpDelete("quan-ly-nguoi-dung/{userId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteUser([FromRoute] int userId)
    {
        var currentUserId = User.GetUserId();
        var result = await _authService.DeleteUserAsync(userId, currentUserId);
        return result.Success ? Ok(new { message = result.Message }) : BadRequest(new { message = result.Message });
    }

    [HttpPut("quan-ly-nguoi-dung/cap-nhat-trang-thai")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateUserStatus([FromBody] UpdateUserStatusRequest request)
    {
        var currentUserId = User.GetUserId();
        var result = await _authService.UpdateUserStatusAsync(request, currentUserId);
        return result.Success ? Ok(new { message = result.Message }) : BadRequest(new { message = result.Message });
    }

    [HttpPost("gan-vai-tro")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AssignRole([FromBody] AssignUserRoleRequest request)
    {
        var result = await _authService.AssignRoleAsync(request);
        return result.Success ? Ok(new { message = result.Message }) : BadRequest(new { message = result.Message });
    }

    [HttpPost("go-vai-tro")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RemoveRole([FromBody] AssignUserRoleRequest request)
    {
        var result = await _authService.RemoveRoleAsync(request);
        return result.Success ? Ok(new { message = result.Message }) : BadRequest(new { message = result.Message });
    }
}
