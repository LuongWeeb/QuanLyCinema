
using System.Text;
using BUS;
using DAL;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
    {
        // Dev mode: allow any localhost port (5173/5174/5176/...)
        policy
            .SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrWhiteSpace(origin)) return false;
                try
                {
                    var uri = new Uri(origin);
                    return uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                        || uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase);
                }
                catch
                {
                    return false;
                }
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "QuanLyRapPhim API", Version = "v1" });
    var scheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
    };
    options.AddSecurityDefinition("Bearer", scheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement { { scheme, Array.Empty<string>() } });
});

builder.Services.AddDbContext<CinemaDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IReservationService, ReservationService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<ITicketService, TicketService>();

var jwtSection = builder.Configuration.GetSection("Jwt");
var signingKey = jwtSection["Key"] ?? throw new InvalidOperationException("Missing Jwt:Key in appsettings.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey))
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
    db.Database.EnsureCreated();
    await db.Database.ExecuteSqlRawAsync("""
        IF COL_LENGTH('dbo.Movies', 'PosterUrl') IS NULL
          ALTER TABLE [dbo].[Movies] ADD [PosterUrl] NVARCHAR(500) NULL;
        """);
    await db.Database.ExecuteSqlRawAsync("""
        IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'MovieRatings' AND schema_id = SCHEMA_ID('dbo'))
        BEGIN
          CREATE TABLE [dbo].[MovieRatings] (
            [Id] int NOT NULL IDENTITY,
            [UserId] int NOT NULL,
            [MovieId] int NOT NULL,
            [Stars] tinyint NOT NULL,
            [CreatedAt] datetime2 NOT NULL,
            CONSTRAINT [PK_MovieRatings] PRIMARY KEY ([Id]),
            CONSTRAINT [FK_MovieRatings_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id]) ON DELETE CASCADE,
            CONSTRAINT [FK_MovieRatings_Movies_MovieId] FOREIGN KEY ([MovieId]) REFERENCES [dbo].[Movies] ([Id]) ON DELETE CASCADE
          );
          CREATE UNIQUE INDEX [IX_MovieRatings_UserId_MovieId] ON [dbo].[MovieRatings] ([UserId], [MovieId]);
        END
        """);
    await db.Database.ExecuteSqlRawAsync("""
        IF COL_LENGTH('dbo.Seats', 'IsVip') IS NULL
          ALTER TABLE [dbo].[Seats] ADD [IsVip] bit NOT NULL CONSTRAINT [DF_Seats_IsVip] DEFAULT 0;
        """);
    var authService = scope.ServiceProvider.GetRequiredService<IAuthService>();
    await authService.SeedDefaultUsersAsync();
}

var webRoot = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
Directory.CreateDirectory(Path.Combine(webRoot, "posters"));

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("FrontendDev");
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
