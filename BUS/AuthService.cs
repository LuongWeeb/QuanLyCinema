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
    Task<(bool Success, string Message)> RegisterAsync(RegisterRequest request);
    Task<IReadOnlyList<CustomerLookupDto>> SearchCustomersAsync(string? keyword, int take = 30);
    Task<PagedUsersResponse> GetUsersWithRolesAsync(UserManagementQuery query);
    Task<(bool Success, string Message)> CreateUserAsync(CreateUserRequest request);
    Task<(bool Success, string Message)> UpdateUserAsync(UpdateUserRequest request);
    Task<(bool Success, string Message)> UpdateUserStatusAsync(UpdateUserStatusRequest request, int currentUserId);
    Task<(bool Success, string Message)> DeleteUserAsync(int userId, int currentUserId);
    Task<(bool Success, string Message)> AssignRoleAsync(AssignUserRoleRequest request);
    Task<(bool Success, string Message)> RemoveRoleAsync(AssignUserRoleRequest request);
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
        await EnsureAuthTablesAsync();

        try
        {
            _ = await _db.Users.CountAsync();
            _ = await _db.Roles.CountAsync();
            _ = await _db.UserRoles.CountAsync();
        }
        catch (SqlException ex) when (ex.Number == 208 || ex.Number == 207)
        {
            await EnsureAuthTablesAsync();
        }

        var requiredRoles = new[] { "Admin", "Staff", "Customer" };
        var existingRoles = await _db.Roles.ToDictionaryAsync(x => x.Name, x => x);
        foreach (var roleName in requiredRoles)
        {
            if (!existingRoles.ContainsKey(roleName))
            {
                var role = new Role { Name = roleName };
                _db.Roles.Add(role);
                existingRoles[roleName] = role;
            }
        }

        await _db.SaveChangesAsync();

        var users = await _db.Users.ToDictionaryAsync(x => x.Username, x => x);
        AddUserIfMissing(users, "admin", "System Admin");
        AddUserIfMissing(users, "staff", "Ticket Staff");
        AddUserIfMissing(users, "customer", "Default Customer");
        await _db.SaveChangesAsync();

        await EnsureUserRoleAsync(users["admin"].Id, existingRoles["Admin"].Id);
        await EnsureUserRoleAsync(users["staff"].Id, existingRoles["Staff"].Id);
        await EnsureUserRoleAsync(users["customer"].Id, existingRoles["Customer"].Id);
        await _db.SaveChangesAsync();
    }

    private void AddUserIfMissing(Dictionary<string, User> users, string username, string fullName)
    {
        if (users.ContainsKey(username))
        {
            return;
        }

        var user = new User
        {
            Username = username,
            FullName = fullName,
            PasswordHash = Hash("123456"),
            CreatedAt = DateTime.UtcNow,
            IsLocked = false
        };
        _db.Users.Add(user);
        users[username] = user;
    }

    private async Task EnsureUserRoleAsync(int userId, int roleId)
    {
        var exists = await _db.UserRoles.AnyAsync(x => x.UserId == userId && x.RoleId == roleId);
        if (!exists)
        {
            _db.UserRoles.Add(new UserRole { UserId = userId, RoleId = roleId });
        }
    }

    private async Task EnsureAuthTablesAsync()
    {
        var sql = @"
IF OBJECT_ID(N'[dbo].[Users]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Users]
    (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Username] NVARCHAR(450) NOT NULL,
        [PasswordHash] NVARCHAR(MAX) NOT NULL,
        [FullName] NVARCHAR(MAX) NOT NULL
    );
    CREATE UNIQUE INDEX [IX_Users_Username] ON [dbo].[Users]([Username]);
END";
        var sqlUserNewColumns = @"
IF COL_LENGTH('dbo.Users', 'CreatedAt') IS NULL
BEGIN
    ALTER TABLE [dbo].[Users] ADD [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_Users_CreatedAt] DEFAULT (SYSUTCDATETIME());
END
IF COL_LENGTH('dbo.Users', 'IsLocked') IS NULL
BEGIN
    ALTER TABLE [dbo].[Users] ADD [IsLocked] BIT NOT NULL CONSTRAINT [DF_Users_IsLocked] DEFAULT (0);
END";
        var sqlLegacyRoleDefault = @"
IF COL_LENGTH('dbo.Users', 'Role') IS NOT NULL
BEGIN
    IF NOT EXISTS
    (
        SELECT 1
        FROM sys.default_constraints dc
        JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(N'[dbo].[Users]')
          AND c.name = N'Role'
    )
    BEGIN
        DECLARE @typeName NVARCHAR(128);
        DECLARE @defaultExpr NVARCHAR(128);
        SELECT @typeName = t.name
        FROM sys.columns c
        JOIN sys.types t ON c.user_type_id = t.user_type_id
        WHERE c.object_id = OBJECT_ID(N'[dbo].[Users]') AND c.name = N'Role';

        IF @typeName IN (N'int', N'bigint', N'smallint', N'tinyint', N'decimal', N'numeric')
            SET @defaultExpr = N'(3)';
        ELSE
            SET @defaultExpr = N'(N''Customer'')';

        EXEC(N'ALTER TABLE [dbo].[Users] ADD CONSTRAINT [DF_Users_Role_Legacy] DEFAULT ' + @defaultExpr + N' FOR [Role];');
    END
END";
        var sqlRoles = @"
IF OBJECT_ID(N'[dbo].[Roles]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Roles]
    (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Name] NVARCHAR(450) NOT NULL
    );
    CREATE UNIQUE INDEX [IX_Roles_Name] ON [dbo].[Roles]([Name]);
END";
        var sqlUserRoles = @"
IF OBJECT_ID(N'[dbo].[UserRoles]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[UserRoles]
    (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [UserId] INT NOT NULL,
        [RoleId] INT NOT NULL,
        CONSTRAINT [FK_UserRoles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]),
        CONSTRAINT [FK_UserRoles_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [dbo].[Roles]([Id])
    );
    CREATE UNIQUE INDEX [IX_UserRoles_UserId_RoleId] ON [dbo].[UserRoles]([UserId], [RoleId]);
END";

        await _db.Database.ExecuteSqlRawAsync(sql);
        await _db.Database.ExecuteSqlRawAsync(sqlUserNewColumns);
        await _db.Database.ExecuteSqlRawAsync(sqlLegacyRoleDefault);
        await _db.Database.ExecuteSqlRawAsync(sqlRoles);
        await _db.Database.ExecuteSqlRawAsync(sqlUserRoles);
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var passwordHash = Hash(request.Password);
        var user = await _db.Users
            .Include(x => x.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(x => x.Username == request.Username && x.PasswordHash == passwordHash);
        if (user is null)
        {
            return null;
        }
        if (user.IsLocked)
        {
            return null;
        }

        var roles = user.UserRoles.Select(x => x.Role.Name).Distinct().ToList();
        if (roles.Count == 0)
        {
            return null;
        }

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, user.Username)
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

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
            roles.First());
    }

    public async Task<(bool Success, string Message)> RegisterAsync(RegisterRequest request)
    {
        var username = request.Username.Trim();
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return (false, "Thông tin đăng ký không hợp lệ.");
        }

        await SeedDefaultUsersAsync();

        var exists = await _db.Users.AnyAsync(x => x.Username == username);
        if (exists)
        {
            return (false, "Tên đăng nhập đã tồn tại.");
        }

        var customerRole = await _db.Roles.FirstOrDefaultAsync(x => x.Name == "Customer");
        if (customerRole is null)
        {
            return (false, "Hệ thống chưa có vai trò Customer.");
        }

        var user = new User
        {
            Username = username,
            PasswordHash = Hash(request.Password),
            FullName = request.FullName.Trim(),
            CreatedAt = DateTime.UtcNow,
            IsLocked = false
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        _db.UserRoles.Add(new UserRole
        {
            UserId = user.Id,
            RoleId = customerRole.Id
        });
        await _db.SaveChangesAsync();

        return (true, "Đăng ký tài khoản thành công.");
    }

    public async Task<IReadOnlyList<CustomerLookupDto>> SearchCustomersAsync(string? keyword, int take = 30)
    {
        take = Math.Clamp(take, 1, 50);
        var customerRole = await _db.Roles.AsNoTracking().FirstOrDefaultAsync(x => x.Name == "Customer");
        if (customerRole is null)
        {
            return Array.Empty<CustomerLookupDto>();
        }

        var q = keyword?.Trim();
        var query = _db.Users
            .AsNoTracking()
            .Where(u => !u.IsLocked)
            .Where(u => u.UserRoles.Any(ur => ur.RoleId == customerRole.Id));

        if (!string.IsNullOrEmpty(q))
        {
            query = query.Where(u => u.Username.Contains(q) || u.FullName.Contains(q));
        }

        return await query
            .OrderBy(u => u.Username)
            .Take(take)
            .Select(u => new CustomerLookupDto(u.Id, u.Username, u.FullName))
            .ToListAsync();
    }

    public async Task<PagedUsersResponse> GetUsersWithRolesAsync(UserManagementQuery query)
    {
        var page = query.Page <= 0 ? 1 : query.Page;
        var pageSize = query.PageSize <= 0 ? 10 : Math.Min(query.PageSize, 100);
        var keyword = query.Keyword?.Trim();
        var role = query.Role?.Trim();

        var usersQuery = _db.Users
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            usersQuery = usersQuery.Where(x => x.Username.Contains(keyword) || x.FullName.Contains(keyword));
        }
        if (!string.IsNullOrWhiteSpace(role))
        {
            usersQuery = usersQuery.Where(x => x.UserRoles.Any(ur => ur.Role.Name == role));
        }

        var total = await usersQuery.CountAsync();
        var users = await usersQuery
            .OrderByDescending(x => x.CreatedAt)
            .ThenBy(x => x.Username)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new UserWithRolesResponse(
                x.Id,
                x.Username,
                x.FullName,
                x.CreatedAt,
                x.IsLocked ? "Locked" : "Active",
                x.UserRoles.Select(ur => new UserRoleItem(ur.RoleId, ur.Role.Name)).ToList()))
            .ToListAsync();

        return new PagedUsersResponse(page, pageSize, total, users);
    }

    public async Task<(bool Success, string Message)> CreateUserAsync(CreateUserRequest request)
    {
        var username = request.Username.Trim();
        var fullName = request.FullName.Trim();
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(fullName))
        {
            return (false, "Thông tin tài khoản không hợp lệ.");
        }

        var exists = await _db.Users.AnyAsync(x => x.Username == username);
        if (exists)
        {
            return (false, "Tên đăng nhập đã tồn tại.");
        }

        var roleNames = (request.Roles ?? new List<string> { "Customer" })
            .Select(x => x.Trim())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        if (roleNames.Count == 0)
        {
            roleNames.Add("Customer");
        }

        var roles = await _db.Roles.Where(x => roleNames.Contains(x.Name)).ToListAsync();
        if (roles.Count != roleNames.Count)
        {
            return (false, "Một hoặc nhiều vai trò không tồn tại.");
        }

        var user = new User
        {
            Username = username,
            PasswordHash = Hash(request.Password),
            FullName = fullName,
            CreatedAt = DateTime.UtcNow,
            IsLocked = false
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        foreach (var role in roles)
        {
            _db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
        }
        await _db.SaveChangesAsync();

        return (true, "Tạo tài khoản thành công.");
    }

    public async Task<(bool Success, string Message)> UpdateUserAsync(UpdateUserRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == request.UserId);
        if (user is null)
        {
            return (false, "Không tìm thấy người dùng.");
        }

        var username = request.Username.Trim();
        var fullName = request.FullName.Trim();
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(fullName))
        {
            return (false, "Thông tin cập nhật không hợp lệ.");
        }

        var duplicate = await _db.Users.AnyAsync(x => x.Id != request.UserId && x.Username == username);
        if (duplicate)
        {
            return (false, "Tên đăng nhập đã tồn tại.");
        }

        user.Username = username;
        user.FullName = fullName;
        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.PasswordHash = Hash(request.Password);
        }

        await _db.SaveChangesAsync();
        return (true, "Cập nhật tài khoản thành công.");
    }

    public async Task<(bool Success, string Message)> UpdateUserStatusAsync(UpdateUserStatusRequest request, int currentUserId)
    {
        var user = await _db.Users
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(x => x.Id == request.UserId);
        if (user is null)
        {
            return (false, "Không tìm thấy người dùng.");
        }

        var status = request.Status.Trim();
        var shouldLock = status.Equals("locked", StringComparison.OrdinalIgnoreCase);
        var shouldActive = status.Equals("active", StringComparison.OrdinalIgnoreCase);
        if (!shouldLock && !shouldActive)
        {
            return (false, "Trạng thái không hợp lệ. Chỉ nhận active hoặc locked.");
        }

        if (currentUserId == user.Id && shouldLock)
        {
            return (false, "Không thể tự khóa tài khoản đang đăng nhập.");
        }

        var isAdmin = user.UserRoles.Any(x => x.Role.Name == "Admin");
        if (isAdmin && shouldLock)
        {
            var isLastAdmin = await IsLastAdminUserAsync(user.Id);
            if (isLastAdmin)
            {
                return (false, "Không thể khóa Admin cuối cùng để tránh lockout hệ thống.");
            }
        }

        user.IsLocked = shouldLock;
        await _db.SaveChangesAsync();
        return (true, "Cập nhật trạng thái tài khoản thành công.");
    }

    public async Task<(bool Success, string Message)> DeleteUserAsync(int userId, int currentUserId)
    {
        var user = await _db.Users
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(x => x.Id == userId);
        if (user is null)
        {
            return (false, "Không tìm thấy người dùng.");
        }
        if (currentUserId == userId)
        {
            return (false, "Không thể tự xóa chính tài khoản đang đăng nhập.");
        }

        var isAdmin = user.UserRoles.Any(x => x.Role.Name == "Admin");
        if (isAdmin)
        {
            var isLastAdmin = await IsLastAdminUserAsync(user.Id);
            if (isLastAdmin)
            {
                return (false, "Không thể xóa tài khoản Admin cuối cùng.");
            }
        }

        _db.UserRoles.RemoveRange(user.UserRoles);
        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return (true, "Xóa tài khoản thành công.");
    }

    public async Task<(bool Success, string Message)> AssignRoleAsync(AssignUserRoleRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == request.UserId);
        if (user is null)
        {
            return (false, "Không tìm thấy người dùng.");
        }

        var role = await _db.Roles.FirstOrDefaultAsync(x => x.Name == request.RoleName.Trim());
        if (role is null)
        {
            return (false, "Không tìm thấy vai trò.");
        }

        var exists = await _db.UserRoles.AnyAsync(x => x.UserId == user.Id && x.RoleId == role.Id);
        if (exists)
        {
            return (false, "Người dùng đã có vai trò này.");
        }

        _db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
        await _db.SaveChangesAsync();
        return (true, "Gán vai trò thành công.");
    }

    public async Task<(bool Success, string Message)> RemoveRoleAsync(AssignUserRoleRequest request)
    {
        var roleName = request.RoleName.Trim();
        var role = await _db.Roles.FirstOrDefaultAsync(x => x.Name == roleName);
        if (role is null)
        {
            return (false, "Không tìm thấy vai trò.");
        }

        var userRole = await _db.UserRoles.FirstOrDefaultAsync(x => x.UserId == request.UserId && x.RoleId == role.Id);
        if (userRole is null)
        {
            return (false, "Người dùng chưa có vai trò này.");
        }

        var roleCount = await _db.UserRoles.CountAsync(x => x.UserId == request.UserId);
        if (roleCount <= 1)
        {
            return (false, "Người dùng phải có ít nhất một vai trò.");
        }

        if (string.Equals(roleName, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            var isLastAdmin = await IsLastAdminUserAsync(request.UserId);
            if (isLastAdmin)
            {
                return (false, "Không thể gỡ vai trò Admin cuối cùng để tránh lockout hệ thống.");
            }
        }

        _db.UserRoles.Remove(userRole);
        await _db.SaveChangesAsync();
        return (true, "Gỡ vai trò thành công.");
    }

    private static string Hash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes);
    }

    private async Task<bool> IsLastAdminUserAsync(int userId)
    {
        var adminUserIds = await _db.UserRoles
            .Include(x => x.Role)
            .Where(x => x.Role.Name == "Admin")
            .Select(x => x.UserId)
            .Distinct()
            .ToListAsync();
        return adminUserIds.Count == 1 && adminUserIds[0] == userId;
    }
}
