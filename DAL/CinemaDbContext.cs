using DTO;
using Microsoft.EntityFrameworkCore;

namespace DAL;

public class CinemaDbContext : DbContext
{
    public CinemaDbContext(DbContextOptions<CinemaDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Movie> Movies => Set<Movie>();
    public DbSet<Showtime> Showtimes => Set<Showtime>();
    public DbSet<Auditorium> Auditoriums => Set<Auditorium>();
    public DbSet<Seat> Seats => Set<Seat>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasIndex(x => x.Username).IsUnique();
        modelBuilder.Entity<Seat>().HasIndex(x => new { x.AuditoriumId, x.SeatCode }).IsUnique();
        modelBuilder.Entity<Ticket>().HasIndex(x => new { x.ReservationId, x.SeatId }).IsUnique();
        modelBuilder.Entity<Ticket>().HasIndex(x => new { x.ShowtimeId, x.SeatId }).IsUnique();
        modelBuilder.Entity<Ticket>().HasIndex(x => x.QrCode).IsUnique();

        modelBuilder.Entity<Reservation>()
            .HasMany(x => x.Tickets)
            .WithOne(x => x.Reservation)
            .HasForeignKey(x => x.ReservationId);

        modelBuilder.Entity<Auditorium>()
            .HasMany(x => x.Seats)
            .WithOne(x => x.Auditorium)
            .HasForeignKey(x => x.AuditoriumId);
    }
}
