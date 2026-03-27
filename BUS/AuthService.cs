using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using DAL;
using DTO;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace BUS;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
    Task SeedDefaultUsersAsync();
}

public class AuthService : IAuthService
{
    private readonly CinemaDbContext _db;
    private readonly JwtOptions _jwt;

    public AuthService(CinemaDbContext db, IOptions<JwtOptions> jwt)
    {
        _db = db;
        _jwt = jwt.Value;
    }

    public async Task SeedDefaultUsersAsync()
    {
        try
        {
            if (await _db.Users.AnyAsync())
            {
                return;
            }
        }
        catch (SqlException ex) when (ex.Number == 208)
        {
            // Existing database may have old schema without Users table.
            await EnsureUsersTableAsync();
        }

        var users = new List<User>
        {
            new() { Username = "admin", FullName = "System Admin", Role = UserRole.Admin, PasswordHash = Hash("123456") },
            new() { Username = "staff", FullName = "Ticket Staff", Role = UserRole.Staff, PasswordHash = Hash("123456") },
            new() { Username = "customer", FullName = "Default Customer", Role = UserRole.Customer, PasswordHash = Hash("123456") }
        };
        _db.Users.AddRange(users);
        await _db.SaveChangesAsync();
    }

    private async Task EnsureUsersTableAsync()
    {
        var sql = @"
IF OBJECT_ID(N'[dbo].[Users]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Users]
    (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Username] NVARCHAR(450) NOT NULL,
        [PasswordHash] NVARCHAR(MAX) NOT NULL,
        [Role] INT NOT NULL,
        [FullName] NVARCHAR(MAX) NOT NULL
    );
    CREATE UNIQUE INDEX [IX_Users_Username] ON [dbo].[Users]([Username]);
END";

        await _db.Database.ExecuteSqlRawAsync(sql);
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var passwordHash = Hash(request.Password);
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Username == request.Username && x.PasswordHash == passwordHash);
        if (user is null)
        {
            return null;
        }

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, user.Username),
            new(ClaimTypes.Role, user.Role.ToString())
        };

        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds);

        return new LoginResponse(
            new JwtSecurityTokenHandler().WriteToken(token),
            user.Username,
            user.Role.ToString());
    }

    private static string Hash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes);
    }
}
