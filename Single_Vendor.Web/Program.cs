using System.Text;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Single_Vendor.Infrastructure;
using Single_Vendor.Infrastructure.Data;
using Single_Vendor.Web.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));
builder.Services.AddDbContext<SingleVendorDbContext>(options =>
    options.UseSqlServer(connectionString));
builder.Services.AddDatabaseDeveloperPageExceptionFilter();

builder.Services.AddDefaultIdentity<IdentityUser>(options => options.SignIn.RequireConfirmedAccount = true)
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>();

var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is not configured.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

var authBuilder = builder.Services.AddAuthentication()
    .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
if (!string.IsNullOrWhiteSpace(googleClientId))
{
    authBuilder.AddGoogle(GoogleDefaults.AuthenticationScheme, options =>
    {
        options.ClientId = googleClientId;
        options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"] ?? "";
    });
}

builder.Services.AddAuthorization();

builder.Services.AddScoped<IAdminStoreAccessor, AdminStoreAccessor>();
builder.Services.AddScoped<ICustomerJwtIssuer, CustomerJwtIssuer>();
builder.Services.AddScoped<ResponsiveImageService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("SpaDev", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5174")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddControllersWithViews();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var identityDb = services.GetRequiredService<ApplicationDbContext>();
    try
    {
        await identityDb.Database.MigrateAsync();
    }
    catch (SqlException ex) when (ex.Number == 2714)
    {
        app.Logger.LogWarning(ex, "Skipping Identity auto-migration because objects already exist in the database.");
    }

    var vendorDb = services.GetRequiredService<SingleVendorDbContext>();
    await vendorDb.Database.ExecuteSqlRawAsync("""
IF OBJECT_ID(N'dbo.StorePromoAds', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[StorePromoAds](
        [StorePromoAdId] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [StoreId] [int] NOT NULL,
        [SlotIndex] [tinyint] NOT NULL,
        [TitleLine] [nvarchar](120) NOT NULL,
        [BigText] [nvarchar](50) NOT NULL,
        [SubLine] [nvarchar](120) NOT NULL,
        [LinkUrl] [nvarchar](1000) NULL,
        [ImageUrl] [nvarchar](1000) NULL,
        [IsActive] [bit] NOT NULL CONSTRAINT [DF_StorePromoAds_IsActive] DEFAULT ((1)),
        [UpdatedAtUtc] [datetime2](7) NOT NULL
    );
    CREATE UNIQUE INDEX [UX_StorePromoAds_Store_Slot] ON [dbo].[StorePromoAds]([StoreId],[SlotIndex]);
    CREATE INDEX [IX_StorePromoAds_StoreId] ON [dbo].[StorePromoAds]([StoreId]);
END
""");
    await vendorDb.Database.ExecuteSqlRawAsync("""
IF COL_LENGTH(N'dbo.ProductReviews', N'StoreId') IS NULL
BEGIN
    ALTER TABLE [dbo].[ProductReviews] ADD [StoreId] [int] NULL;
    CREATE INDEX [IX_ProductReviews_StoreId] ON [dbo].[ProductReviews]([StoreId]);
END
""");
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseMigrationsEndPoint();
}
else
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseCors("SpaDev");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Exact root URL serves the React app (Home/Index returns wwwroot/index.html).
app.MapControllerRoute(
    name: "root",
    pattern: "",
    defaults: new { controller = "Home", action = "Index" });

// MVC routes for legacy/error pages only (do not use {controller}/{action} catch-all — it would break /admin/* client routes).
app.MapControllerRoute(
    name: "home_error",
    pattern: "Home/Error",
    defaults: new { controller = "Home", action = "Error" });
app.MapControllerRoute(
    name: "home_privacy",
    pattern: "Home/Privacy",
    defaults: new { controller = "Home", action = "Privacy" });

app.MapRazorPages();

// Deep links (/admin/..., /products, etc.) → SPA; API and Identity paths are matched above.
app.MapFallbackToFile("index.html");

app.Run();
