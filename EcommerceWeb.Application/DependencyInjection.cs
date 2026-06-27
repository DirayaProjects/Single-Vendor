using EcommerceWeb.Application.Interfaces;
using EcommerceWeb.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace EcommerceWeb.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IAttributeService, AttributeService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<ISettingsService, SettingsService>();
        services.AddScoped<IStorefrontService, StorefrontService>();
        services.AddScoped<ICartService, CartService>();
        services.AddScoped<IProductReviewService, ProductReviewService>();
        return services;
    }
}
