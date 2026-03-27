using DAL;
using DTO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace QuanLyRapPhim.Controllers;

[ApiController]
[Route("api/lich-chieu")]
[Authorize]
public class ShowtimesController : ControllerBase
{
    private readonly CinemaDbContext _db;

    public ShowtimesController(CinemaDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var data = await _db.Showtimes.Include(s => s.Movie).Include(s => s.Auditorium).ToListAsync();
        return Ok(data);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Create([FromBody] ShowtimeRequest request)
    {
        var entity = new Showtime
        {
            MovieId = request.MovieId,
            AuditoriumId = request.AuditoriumId,
            StartTime = request.StartTime,
            Price = request.Price
        };
        _db.Showtimes.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpGet("{showtimeId:int}/so-do-ghe")]
    [AllowAnonymous]
    public async Task<IActionResult> SeatMap(int showtimeId)
    {
        var showtime = await _db.Showtimes.Include(s => s.Auditorium).FirstOrDefaultAsync(s => s.Id == showtimeId);
        if (showtime is null)
        {
            return NotFound();
        }

        var seats = await _db.Seats.Where(s => s.AuditoriumId == showtime.AuditoriumId).ToListAsync();
        var soldSeatIds = await _db.Tickets.Where(t => t.ShowtimeId == showtimeId).Select(t => t.SeatId).ToListAsync();
        var result = seats.Select(s => new
        {
            s.Id,
            s.SeatCode,
            Status = soldSeatIds.Contains(s.Id) ? SeatStatus.Sold : SeatStatus.Available
        });
        return Ok(result);
    }
}
