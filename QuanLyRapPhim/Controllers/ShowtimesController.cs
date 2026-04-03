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
    public async Task<IActionResult> GetAll([FromQuery] int? phimId = null)
    {
        var q = _db.Showtimes.Include(s => s.Movie).Include(s => s.Auditorium).AsQueryable();
        if (phimId.HasValue)
        {
            q = q.Where(s => s.MovieId == phimId.Value);
        }

        var data = await q.OrderBy(s => s.StartTime).ToListAsync();
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

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Update(int id, [FromBody] ShowtimeRequest request)
    {
        var entity = await _db.Showtimes.FirstOrDefaultAsync(x => x.Id == id);
        if (entity is null)
        {
            return NotFound(new { message = "Không tìm thấy suất chiếu." });
        }

        var hasTickets = await _db.Tickets.AnyAsync(t => t.ShowtimeId == id);
        if (hasTickets)
        {
            return BadRequest(new { message = "Không thể sửa suất đã có vé đặt." });
        }

        entity.MovieId = request.MovieId;
        entity.AuditoriumId = request.AuditoriumId;
        entity.StartTime = request.StartTime;
        entity.Price = request.Price;
        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Showtimes.FirstOrDefaultAsync(x => x.Id == id);
        if (entity is null)
        {
            return NotFound(new { message = "Không tìm thấy suất chiếu." });
        }

        var hasTickets = await _db.Tickets.AnyAsync(t => t.ShowtimeId == id);
        if (hasTickets)
        {
            return BadRequest(new { message = "Không thể xóa suất đã có vé đặt." });
        }

        _db.Showtimes.Remove(entity);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Xóa suất chiếu thành công." });
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
            s.IsVip,
            Status = soldSeatIds.Contains(s.Id) ? SeatStatus.Sold : SeatStatus.Available
        });
        return Ok(result);
    }
}
