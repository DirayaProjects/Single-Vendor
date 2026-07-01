using EcommerceWeb.Core.Interfaces;
using EcommerceWeb.Infrastructure.Data;
using EcommerceWeb.Infrastructure.Repositories;
using EcommerceWeb.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace EcommerceWeb.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

        services.AddDbContext<EcommerceWebDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddScoped<IDashboardRepository, DashboardRepository>();
        services.AddScoped<IAuthRepository, AuthRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IAttributeRepository, AttributeRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<ISettingsRepository, SettingsRepository>();
        services.AddScoped<IStorefrontRepository, StorefrontRepository>();
        services.AddScoped<ICartRepository, CartRepository>();
        services.AddScoped<IProductReviewRepository, ProductReviewRepository>();
        services.AddScoped<IFavoriteRepository, FavoriteRepository>();
        services.AddScoped<IPromoAdRepository, PromoAdRepository>();
        services.AddScoped<IDeliveryCityRepository, DeliveryCityRepository>();
        services.AddScoped<ISpinWheelRepository, SpinWheelRepository>();
        services.AddScoped<IGeneralDiscountRepository, GeneralDiscountRepository>();
        services.AddScoped<IUserProfileRepository, UserProfileRepository>();
        services.AddScoped<IImageStorageService, ImageStorageService>();
        services.AddSingleton<IPasswordVerifier, PasswordVerifier>();

        return services;
    }
}
