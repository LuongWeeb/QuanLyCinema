using DAL;
using DTO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace QuanLyRapPhim.Controllers;

[ApiController]
[Route("api/phong-chieu")]
[Authorize(Roles = "Admin,Staff")]
public class AuditoriumsController : ControllerBase
{
    private readonly CinemaDbContext _db;

    public AuditoriumsController(CinemaDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAuditoriumRequest request)
    {
        var room = new Auditorium { Name = request.Name, Capacity = request.Capacity };
        _db.Auditoriums.Add(room);
        await _db.SaveChangesAsync();

        var seats = request.SeatCodes.Select(code => new Seat { AuditoriumId = room.Id, SeatCode = code }).ToList();
        _db.Seats.AddRange(seats);
        await _db.SaveChangesAsync();

        return Ok(new { room.Id, room.Name, Seats = seats.Count });
    }

    [HttpGet("{auditoriumId:int}/ghe")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSeats(int auditoriumId)
    {
        var seats = await _db.Seats.Where(x => x.AuditoriumId == auditoriumId).ToListAsync();
        return Ok(seats);
    }
}
