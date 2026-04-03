using DAL;
using DTO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanLyRapPhim.Extensions;

namespace QuanLyRapPhim.Controllers;

[ApiController]
[Route("api/phim")]
[Authorize]
public class MoviesController : ControllerBase
{
    private readonly CinemaDbContext _db;
    private readonly IWebHostEnvironment _env;

    public MoviesController(CinemaDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
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
            query = query.Where(x => x.Name.Contains(keyword) || x.Genre.Contains(keyword));
        }

        if (!string.IsNullOrWhiteSpace(theLoai))
        {
            var genre = theLoai.Trim();
            query = query.Where(x => x.Genre.Contains(genre));
        }

        var movies = await query.OrderByDescending(x => x.Id).ToListAsync();

        // `Movie.Rating` đang là một giá trị khác (có thể > 5, ví dụ IMDb).
        // Để trang chủ hiển thị đúng "số sao 1..5" thì trả về average từ `MovieRatings`.
        var movieIds = movies.Select(m => m.Id).ToList();
        var avgByMovie = movieIds.Count == 0
            ? new Dictionary<int, double>()
            : await _db.MovieRatings
                .AsNoTracking()
                .Where(r => movieIds.Contains(r.MovieId))
                .GroupBy(r => r.MovieId)
                .Select(g => new { MovieId = g.Key, Avg = g.Average(r => (double)r.Stars) })
                .ToDictionaryAsync(x => x.MovieId, x => x.Avg);

        var result = movies.Select(m =>
        {
            var avg = avgByMovie.TryGetValue(m.Id, out var a) ? a : 0d;
            var clamped = (decimal)Math.Clamp(avg, 0d, 5d);
            return new Movie
            {
                Id = m.Id,
                Name = m.Name,
                Genre = m.Genre,
                DurationMinutes = m.DurationMinutes,
                Rating = clamped,
                PosterUrl = m.PosterUrl
            };
        }).ToList();

        return Ok(result);
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

    [HttpGet("{id:int}/chi-tiet")]
    [AllowAnonymous]
    public async Task<IActionResult> GetChiTiet(int id)
    {
        var movie = await _db.Movies.FirstOrDefaultAsync(x => x.Id == id);
        if (movie is null)
        {
            return NotFound(new { message = "Không tìm thấy phim." });
        }

        var q = _db.MovieRatings.Where(r => r.MovieId == id);
        var count = await q.CountAsync();
        var avg = count > 0 ? await q.AverageAsync(r => (double)r.Stars) : 0d;

        int? myStars = null;
        if (User?.Identity?.IsAuthenticated == true)
        {
            var uid = User.GetUserId();
            if (uid > 0)
            {
                var mine = await _db.MovieRatings.FirstOrDefaultAsync(r => r.MovieId == id && r.UserId == uid);
                if (mine != null)
                {
                    myStars = mine.Stars;
                }
            }
        }

        var dto = new MovieDetailResponse(
            movie.Id,
            movie.Name,
            movie.Genre,
            movie.DurationMinutes,
            movie.Rating,
            movie.PosterUrl,
            avg,
            count,
            myStars);
        return Ok(dto);
    }

    [HttpPost("{id:int}/danh-gia")]
    [AllowAnonymous]
    public async Task<IActionResult> Rate(int id, [FromBody] RateMovieRequest request)
    {
        if (User?.Identity?.IsAuthenticated != true)
        {
            return Unauthorized(new { message = "Vui lòng đăng nhập để đánh giá." });
        }

        var uid = User.GetUserId();
        if (uid <= 0)
        {
            return Unauthorized(new { message = "Vui lòng đăng nhập để đánh giá." });
        }

        if (request.Stars < 1 || request.Stars > 5)
        {
            return BadRequest(new { message = "Số sao từ 1 đến 5." });
        }

        var movie = await _db.Movies.FirstOrDefaultAsync(x => x.Id == id);
        if (movie is null)
        {
            return NotFound(new { message = "Không tìm thấy phim." });
        }

        var existing = await _db.MovieRatings.FirstOrDefaultAsync(r => r.MovieId == id && r.UserId == uid);
        if (existing != null)
        {
            existing.Stars = (byte)request.Stars;
            existing.CreatedAt = DateTime.UtcNow;
        }
        else
        {
            _db.MovieRatings.Add(new MovieRating
            {
                UserId = uid,
                MovieId = id,
                Stars = (byte)request.Stars
            });
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "Cảm ơn bạn đã đánh giá." });
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
            Rating = request.Rating,
            PosterUrl = string.IsNullOrWhiteSpace(request.PosterUrl) ? null : request.PosterUrl.Trim()
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
        movie.PosterUrl = string.IsNullOrWhiteSpace(request.PosterUrl) ? null : request.PosterUrl.Trim();

        await _db.SaveChangesAsync();
        return Ok(movie);
    }

    [HttpPost("{id:int}/anh-bia")]
    [Authorize(Roles = "Admin,Staff")]
    [RequestSizeLimit(12 * 1024 * 1024)]
    public async Task<IActionResult> UploadPoster(int id, IFormFile file)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "Chọn file ảnh." });
        }

        var movie = await _db.Movies.FirstOrDefaultAsync(x => x.Id == id);
        if (movie is null)
        {
            return NotFound(new { message = "Không tìm thấy phim." });
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        if (string.IsNullOrEmpty(ext) || !allowed.Contains(ext))
        {
            return BadRequest(new { message = "Chỉ chấp nhận ảnh: jpg, png, webp, gif." });
        }

        var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        var postersDir = Path.Combine(webRoot, "posters");
        Directory.CreateDirectory(postersDir);

        var safeName = $"m{id}_{Guid.NewGuid():N}{ext}";
        var physical = Path.Combine(postersDir, safeName);
        await using (var stream = System.IO.File.Create(physical))
        {
            await file.CopyToAsync(stream);
        }

        movie.PosterUrl = $"/posters/{safeName}";
        await _db.SaveChangesAsync();
        return Ok(new { posterUrl = movie.PosterUrl });
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

        var ratings = await _db.MovieRatings.Where(r => r.MovieId == id).ToListAsync();
        _db.MovieRatings.RemoveRange(ratings);
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
            .GroupBy(s => new
            {
                s.MovieId,
                s.Movie.Name,
                s.Movie.Genre,
                s.Movie.DurationMinutes,
                s.Movie.Rating,
                s.Movie.PosterUrl
            })
            .Select(g => new
            {
                Id = g.Key.MovieId,
                Name = g.Key.Name,
                Genre = g.Key.Genre,
                DurationMinutes = g.Key.DurationMinutes,
                Rating = g.Key.Rating,
                PosterUrl = g.Key.PosterUrl,
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
                x.s.Movie.Rating,
                x.s.Movie.PosterUrl
            })
            .Select(g => new
            {
                Id = g.Key.MovieId,
                Name = g.Key.Name,
                Genre = g.Key.Genre,
                DurationMinutes = g.Key.DurationMinutes,
                Rating = g.Key.Rating,
                PosterUrl = g.Key.PosterUrl,
                TongDoanhThu = g.Sum(x => x.pir.pi.i.TotalAmount)
            })
            .OrderByDescending(x => x.TongDoanhThu)
            .Take(take)
            .ToListAsync();

        return Ok(top);
    }
}
