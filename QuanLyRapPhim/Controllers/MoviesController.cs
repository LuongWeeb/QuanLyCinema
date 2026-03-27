using DAL;
using DTO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace QuanLyRapPhim.Controllers;

[ApiController]
[Route("api/phim")]
[Authorize]
public class MoviesController : ControllerBase
{
    private readonly CinemaDbContext _db;

    public MoviesController(CinemaDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? tuKhoa = null,
        [FromQuery] string? theLoai = null)
    {
        var query = _db.Movies.AsQueryable();

        if (!string.IsNullOrWhiteSpace(tuKhoa))
        {
            var keyword = tuKhoa.Trim();
            query = query.Where(x => x.Name.Contains(keyword));
        }

        if (!string.IsNullOrWhiteSpace(theLoai))
        {
            var genre = theLoai.Trim();
            query = query.Where(x => x.Genre.Contains(genre));
        }

        var movies = await query.OrderByDescending(x => x.Id).ToListAsync();
        return Ok(movies);
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var movie = await _db.Movies.FirstOrDefaultAsync(x => x.Id == id);
        if (movie is null)
        {
            return NotFound(new { message = "Không tìm thấy phim." });
        }

        return Ok(movie);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Create([FromBody] MovieRequest request)
    {
        var entity = new Movie
        {
            Name = request.Name,
            Genre = request.Genre,
            DurationMinutes = request.DurationMinutes,
            Rating = request.Rating
        };
        _db.Movies.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Update(int id, [FromBody] MovieRequest request)
    {
        var movie = await _db.Movies.FirstOrDefaultAsync(x => x.Id == id);
        if (movie is null)
        {
            return NotFound(new { message = "Không tìm thấy phim." });
        }

        movie.Name = request.Name;
        movie.Genre = request.Genre;
        movie.DurationMinutes = request.DurationMinutes;
        movie.Rating = request.Rating;

        await _db.SaveChangesAsync();
        return Ok(movie);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var movie = await _db.Movies.FirstOrDefaultAsync(x => x.Id == id);
        if (movie is null)
        {
            return NotFound(new { message = "Không tìm thấy phim." });
        }

        var hasShowtime = await _db.Showtimes.AnyAsync(x => x.MovieId == id);
        if (hasShowtime)
        {
            return BadRequest(new { message = "Không thể xóa phim đã có lịch chiếu." });
        }

        _db.Movies.Remove(movie);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Xóa phim thành công." });
    }

    [HttpGet("moi-cap-nhat")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLatest([FromQuery] int soLuong = 10)
    {
        var take = Math.Clamp(soLuong, 1, 50);
        var movies = await _db.Movies.OrderByDescending(x => x.Id).Take(take).ToListAsync();
        return Ok(movies);
    }

    [HttpGet("sap-chieu")]
    [AllowAnonymous]
    public async Task<IActionResult> GetUpcoming([FromQuery] int soLuong = 10)
    {
        var take = Math.Clamp(soLuong, 1, 50);
        var now = DateTime.UtcNow;

        var upcoming = await _db.Showtimes
            .Where(s => s.StartTime > now)
            .Include(s => s.Movie)
            .GroupBy(s => new { s.MovieId, s.Movie.Name, s.Movie.Genre, s.Movie.DurationMinutes, s.Movie.Rating })
            .Select(g => new
            {
                Id = g.Key.MovieId,
                Name = g.Key.Name,
                Genre = g.Key.Genre,
                DurationMinutes = g.Key.DurationMinutes,
                Rating = g.Key.Rating,
                SuatChieuSomNhat = g.Min(x => x.StartTime)
            })
            .OrderBy(x => x.SuatChieuSomNhat)
            .Take(take)
            .ToListAsync();

        return Ok(upcoming);
    }

    [HttpGet("top-doanh-thu")]
    [AllowAnonymous]
    public async Task<IActionResult> GetTopRevenue([FromQuery] int soLuong = 10)
    {
        var take = Math.Clamp(soLuong, 1, 50);

        var top = await _db.Payments
            .Where(p => p.Status == PaymentStatus.Success)
            .Join(_db.Invoices, p => p.InvoiceId, i => i.Id, (p, i) => new { p, i })
            .Join(_db.Reservations, pi => pi.i.ReservationId, r => r.Id, (pi, r) => new { pi, r })
            .Join(_db.Showtimes.Include(s => s.Movie), pir => pir.r.ShowtimeId, s => s.Id, (pir, s) => new { pir, s })
            .GroupBy(x => new
            {
                x.s.MovieId,
                x.s.Movie.Name,
                x.s.Movie.Genre,
                x.s.Movie.DurationMinutes,
                x.s.Movie.Rating
            })
            .Select(g => new
            {
                Id = g.Key.MovieId,
                Name = g.Key.Name,
                Genre = g.Key.Genre,
                DurationMinutes = g.Key.DurationMinutes,
                Rating = g.Key.Rating,
                TongDoanhThu = g.Sum(x => x.pir.pi.i.TotalAmount)
            })
            .OrderByDescending(x => x.TongDoanhThu)
            .Take(take)
            .ToListAsync();

        return Ok(top);
    }
}
