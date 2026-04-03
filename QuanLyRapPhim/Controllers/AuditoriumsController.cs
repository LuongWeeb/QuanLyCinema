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

    /// <summary>Danh sách phòng (route rõ ràng để tránh 405 khi client GET).</summary>
    [HttpGet("danh-sach")]
    public async Task<IActionResult> GetDanhSach() => await GetAllInternal();

    [HttpGet]
    public async Task<IActionResult> GetAll() => await GetAllInternal();

    private async Task<IActionResult> GetAllInternal()
    {
        var list = await _db.Auditoriums
            .OrderBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Capacity,
                SeatCount = x.Seats.Count
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var room = await _db.Auditoriums.FirstOrDefaultAsync(x => x.Id == id);
        if (room is null)
        {
            return NotFound(new { message = "Không tìm thấy phòng chiếu." });
        }

        return Ok(room);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAuditoriumRequest request)
    {
        var room = new Auditorium { Name = request.Name, Capacity = request.Capacity };
        _db.Auditoriums.Add(room);
        await _db.SaveChangesAsync();

        var seats = request.SeatCodes
            .Select(code => new Seat { AuditoriumId = room.Id, SeatCode = code, IsVip = false })
            .ToList();
        _db.Seats.AddRange(seats);
        await _db.SaveChangesAsync();

        return Ok(new { room.Id, room.Name, Seats = seats.Count });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAuditoriumRequest request)
    {
        var room = await _db.Auditoriums.FirstOrDefaultAsync(x => x.Id == id);
        if (room is null)
        {
            return NotFound(new { message = "Không tìm thấy phòng chiếu." });
        }

        room.Name = request.Name.Trim();
        room.Capacity = request.Capacity;
        await _db.SaveChangesAsync();
        return Ok(room);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var room = await _db.Auditoriums
            .Include(x => x.Seats)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (room is null)
        {
            return NotFound(new { message = "Không tìm thấy phòng chiếu." });
        }

        var hasShowtime = await _db.Showtimes.AnyAsync(x => x.AuditoriumId == id);
        if (hasShowtime)
        {
            return BadRequest(new { message = "Không thể xóa phòng đã có suất chiếu." });
        }

        _db.Seats.RemoveRange(room.Seats);
        _db.Auditoriums.Remove(room);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Xóa phòng chiếu thành công." });
    }

    [HttpGet("{auditoriumId:int}/ghe")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSeats(int auditoriumId)
    {
        var seats = await _db.Seats.Where(x => x.AuditoriumId == auditoriumId).OrderBy(x => x.SeatCode).ToListAsync();
        return Ok(seats);
    }

    [HttpPost("{auditoriumId:int}/ghe")]
    public async Task<IActionResult> AddSeat(int auditoriumId, [FromBody] AddSeatRequest request)
    {
        var room = await _db.Auditoriums.FirstOrDefaultAsync(x => x.Id == auditoriumId);
        if (room is null)
        {
            return NotFound(new { message = "Không tìm thấy phòng chiếu." });
        }

        var code = request.SeatCode.Trim();
        if (string.IsNullOrEmpty(code))
        {
            return BadRequest(new { message = "Mã ghế không hợp lệ." });
        }

        var dup = await _db.Seats.AnyAsync(x => x.AuditoriumId == auditoriumId && x.SeatCode == code);
        if (dup)
        {
            return BadRequest(new { message = "Mã ghế đã tồn tại trong phòng này." });
        }

        var seat = new Seat { AuditoriumId = auditoriumId, SeatCode = code, IsVip = request.IsVip };
        _db.Seats.Add(seat);
        await _db.SaveChangesAsync();
        return Ok(seat);
    }

    [HttpPost("{auditoriumId:int}/ghe/theo-hang")]
    public async Task<IActionResult> AddSeatsByRow(int auditoriumId, [FromBody] AddSeatsByRowRequest request)
    {
        var room = await _db.Auditoriums.FirstOrDefaultAsync(x => x.Id == auditoriumId);
        if (room is null)
        {
            return NotFound(new { message = "Không tìm thấy phòng chiếu." });
        }

        if (request.RowIndex is < 0 or > 25)
        {
            return BadRequest(new { message = "Chỉ hỗ trợ hàng A–Z (RowIndex 0–25)." });
        }

        if (request.Count is < 1 or > 80)
        {
            return BadRequest(new { message = "Số lượng ghế mỗi lần từ 1 đến 80." });
        }

        if (request.StartNumber < 1)
        {
            return BadRequest(new { message = "Số ghế bắt đầu phải ≥ 1." });
        }

        var rowLetter = (char)('A' + request.RowIndex);
        var codes = Enumerable.Range(0, request.Count)
            .Select(i => $"{rowLetter}{request.StartNumber + i}")
            .ToList();

        var existing = await _db.Seats
            .Where(s => s.AuditoriumId == auditoriumId && codes.Contains(s.SeatCode))
            .Select(s => s.SeatCode)
            .ToListAsync();
        if (existing.Count > 0)
        {
            return BadRequest(new { message = $"Mã ghế đã tồn tại: {string.Join(", ", existing.Take(10))}" });
        }

        var seats = codes.Select(code => new Seat
        {
            AuditoriumId = auditoriumId,
            SeatCode = code,
            IsVip = request.IsVip
        }).ToList();
        _db.Seats.AddRange(seats);
        await _db.SaveChangesAsync();
        return Ok(new { added = seats.Count, codes });
    }

    [HttpPut("{auditoriumId:int}/ghe/vip")]
    public async Task<IActionResult> BulkSetVip(int auditoriumId, [FromBody] BulkSetSeatVipRequest request)
    {
        if (request.SeatIds.Count == 0)
        {
            return BadRequest(new { message = "Chọn ít nhất một ghế." });
        }

        var room = await _db.Auditoriums.FirstOrDefaultAsync(x => x.Id == auditoriumId);
        if (room is null)
        {
            return NotFound(new { message = "Không tìm thấy phòng chiếu." });
        }

        var seats = await _db.Seats
            .Where(s => s.AuditoriumId == auditoriumId && request.SeatIds.Contains(s.Id))
            .ToListAsync();
        if (seats.Count != request.SeatIds.Count)
        {
            return BadRequest(new { message = "Một số ghế không thuộc phòng này hoặc không tồn tại." });
        }

        foreach (var s in seats)
        {
            s.IsVip = request.IsVip;
        }

        await _db.SaveChangesAsync();
        return Ok(new { updated = seats.Count });
    }

    [HttpPut("{auditoriumId:int}/ghe/{seatId:int}")]
    public async Task<IActionResult> UpdateSeat(int auditoriumId, int seatId, [FromBody] UpdateSeatRequest request)
    {
        var seat = await _db.Seats.FirstOrDefaultAsync(x => x.Id == seatId && x.AuditoriumId == auditoriumId);
        if (seat is null)
        {
            return NotFound(new { message = "Không tìm thấy ghế." });
        }

        var code = request.SeatCode.Trim();
        if (string.IsNullOrEmpty(code))
        {
            return BadRequest(new { message = "Mã ghế không hợp lệ." });
        }

        var dup = await _db.Seats.AnyAsync(x => x.AuditoriumId == auditoriumId && x.SeatCode == code && x.Id != seatId);
        if (dup)
        {
            return BadRequest(new { message = "Mã ghế đã tồn tại trong phòng này." });
        }

        seat.SeatCode = code;
        seat.IsVip = request.IsVip;
        await _db.SaveChangesAsync();
        return Ok(seat);
    }

    [HttpDelete("{auditoriumId:int}/ghe/{seatId:int}")]
    public async Task<IActionResult> DeleteSeat(int auditoriumId, int seatId)
    {
        var seat = await _db.Seats.FirstOrDefaultAsync(x => x.Id == seatId && x.AuditoriumId == auditoriumId);
        if (seat is null)
        {
            return NotFound(new { message = "Không tìm thấy ghế." });
        }

        var hasTicket = await _db.Tickets.AnyAsync(t => t.SeatId == seatId);
        if (hasTicket)
        {
            return BadRequest(new { message = "Không thể xóa ghế đã có vé đặt." });
        }

        _db.Seats.Remove(seat);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Xóa ghế thành công." });
    }
}
