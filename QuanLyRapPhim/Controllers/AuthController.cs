using BUS;
using DTO;
using Microsoft.AspNetCore.Mvc;

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
}
