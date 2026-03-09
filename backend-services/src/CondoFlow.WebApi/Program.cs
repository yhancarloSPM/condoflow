using CondoFlow.Infrastructure.Data;
using CondoFlow.Infrastructure.Identity;
using CondoFlow.Infrastructure.Repositories;
using CondoFlow.Infrastructure.Services;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.WebApi.Middleware;
using CondoFlow.WebApi.Services;
using CondoFlow.WebApi.Hubs;
using CondoFlow.Application.Common.Services;
using CondoFlow.Domain.Configuration;
using CondoFlow.Domain.Enums;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddSignalR();

// Configuration
builder.Services.Configure<DebtConfiguration>(builder.Configuration.GetSection("DebtConfiguration"));

// AutoMapper
builder.Services.AddAutoMapper(typeof(CondoFlow.Application.Mappings.MappingProfile));

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "http://localhost:8081")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Database
if (!builder.Environment.IsEnvironment("Testing"))
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (string.IsNullOrEmpty(connectionString))
        throw new InvalidOperationException("Database connection string is required");

    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(connectionString));
}

// Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrEmpty(jwtKey) || jwtKey.Length < 32)
    throw new InvalidOperationException("JWT key must be at least 32 characters long");

var key = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer is required"),
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience is required"),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(5)
    };
    
    // Configurar eventos para SignalR y archivos
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && 
                (path.StartsWithSegments("/notificationHub") || path.StartsWithSegments("/api/receipts")))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// Custom services
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<ILocalizationService, LocalizationService>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<IEmailService, GmailService>();

// Repositories
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
builder.Services.AddScoped<IDebtRepository, DebtRepository>();
builder.Services.AddScoped<IAnnouncementRepository, AnnouncementRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IReservationRepository, ReservationRepository>();
builder.Services.AddScoped<IApartmentRepository, ApartmentRepository>();
builder.Services.AddScoped<IBlockRepository, BlockRepository>();
builder.Services.AddScoped<ICatalogRepository, CatalogRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IProviderRepository, ProviderRepository>();
builder.Services.AddScoped<IIncidentRepository, IncidentRepository>();
builder.Services.AddScoped<IExpenseRepository, ExpenseRepository>();
builder.Services.AddScoped<IExpenseCategoryRepository, ExpenseCategoryRepository>();
builder.Services.AddScoped<IPollRepository, PollRepository>();
builder.Services.AddScoped<IPollOptionRepository, PollOptionRepository>();
builder.Services.AddScoped<IPollVoteRepository, PollVoteRepository>();
builder.Services.AddScoped<IPaymentConceptRepository, PaymentConceptRepository>();
builder.Services.AddScoped<IStatusRepository, StatusRepository>();

// Infrastructure Services (external APIs, background jobs, Identity)
builder.Services.AddScoped<IIdentityService, IdentityService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IDebtReminderService, DebtReminderService>();
builder.Services.AddHostedService<MonthlyDebtGenerationService>();
builder.Services.AddHostedService<DebtReminderBackgroundService>();

// Application Services (business logic)
builder.Services.AddScoped<IExpenseService, CondoFlow.Application.Services.ExpenseService>();
builder.Services.AddScoped<IProviderService, CondoFlow.Application.Services.ProviderService>();
builder.Services.AddScoped<IPollService, CondoFlow.Application.Services.PollService>();
builder.Services.AddScoped<IIncidentService, CondoFlow.Application.Services.IncidentService>();
builder.Services.AddScoped<IDebtService, CondoFlow.Application.Services.DebtService>();
builder.Services.AddScoped<IUserService, CondoFlow.Application.Services.UserService>();
builder.Services.AddScoped<IOwnerService, CondoFlow.Application.Services.OwnerService>();
builder.Services.AddScoped<IAnnouncementService, CondoFlow.Application.Services.AnnouncementService>();
builder.Services.AddScoped<IAuthService, CondoFlow.Application.Services.AuthService>();
builder.Services.AddScoped<IReservationService, CondoFlow.Application.Services.ReservationService>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// CORS
app.UseCors("AllowAngular");

// Global exception handling
app.UseMiddleware<GlobalExceptionMiddleware>();

// Security headers
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
    await next();
});

// Servir archivos estáticos (comprobantes)
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/notificationHub");

// Seed roles and catalogs
try
{
    using var scope = app.Services.CreateScope();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    
    if (!await roleManager.RoleExistsAsync(UserRoles.Admin))
    {
        var result = await roleManager.CreateAsync(new IdentityRole(UserRoles.Admin));
        if (!result.Succeeded)
            throw new InvalidOperationException("Failed to create Admin role");
    }
    
    if (!await roleManager.RoleExistsAsync(UserRoles.Owner))
    {
        var result = await roleManager.CreateAsync(new IdentityRole(UserRoles.Owner));
        if (!result.Succeeded)
            throw new InvalidOperationException("Failed to create Owner role");
    }
    
    // Seed catalog data
    await CatalogSeeder.SeedAsync(context);
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "Failed to seed roles or catalogs");
    if (!app.Environment.IsEnvironment("Testing"))
        throw;
}

app.Run();

// Make Program class accessible for testing
public partial class Program { }
