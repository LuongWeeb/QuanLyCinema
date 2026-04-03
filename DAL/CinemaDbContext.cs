using DTO;
using Microsoft.EntityFrameworkCore;

namespace DAL;

public class CinemaDbContext : DbContext
{
    public CinemaDbContext(DbContextOptions<CinemaDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Movie> Movies => Set<Movie>();
    public DbSet<MovieRating> MovieRatings => Set<MovieRating>();
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
        modelBuilder.Entity<Role>().HasIndex(x => x.Name).IsUnique();
        modelBuilder.Entity<UserRole>().HasIndex(x => new { x.UserId, x.RoleId }).IsUnique();
        modelBuilder.Entity<Seat>().HasIndex(x => new { x.AuditoriumId, x.SeatCode }).IsUnique();
        modelBuilder.Entity<Ticket>().HasIndex(x => new { x.ReservationId, x.SeatId }).IsUnique();
        modelBuilder.Entity<Ticket>().HasIndex(x => new { x.ShowtimeId, x.SeatId }).IsUnique();
        modelBuilder.Entity<Ticket>().HasIndex(x => x.QrCode).IsUnique();

        modelBuilder.Entity<UserRole>()
            .HasOne(x => x.User)
            .WithMany(x => x.UserRoles)
            .HasForeignKey(x => x.UserId);

        modelBuilder.Entity<UserRole>()
            .HasOne(x => x.Role)
            .WithMany(x => x.UserRoles)
            .HasForeignKey(x => x.RoleId);

        modelBuilder.Entity<Reservation>()
            .HasMany(x => x.Tickets)
            .WithOne(x => x.Reservation)
            .HasForeignKey(x => x.ReservationId);

        modelBuilder.Entity<Auditorium>()
            .HasMany(x => x.Seats)
            .WithOne(x => x.Auditorium)
            .HasForeignKey(x => x.AuditoriumId);

        modelBuilder.Entity<MovieRating>().HasIndex(x => new { x.UserId, x.MovieId }).IsUnique();
        modelBuilder.Entity<MovieRating>()
            .HasOne(x => x.User)
            .WithMany(x => x.MovieRatings)
            .HasForeignKey(x => x.UserId);
        modelBuilder.Entity<MovieRating>()
            .HasOne(x => x.Movie)
            .WithMany(x => x.MovieRatings)
            .HasForeignKey(x => x.MovieId);
    }
}
