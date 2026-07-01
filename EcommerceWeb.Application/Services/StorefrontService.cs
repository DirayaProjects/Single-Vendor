using EcommerceWeb.Application.Dtos;

using EcommerceWeb.Application.Helpers;

using EcommerceWeb.Application.Interfaces;

using EcommerceWeb.Core.Entities;

using EcommerceWeb.Core.Interfaces;



namespace EcommerceWeb.Application.Services;



public class StorefrontService : IStorefrontService

{

    private readonly IStorefrontRepository _storefrontRepository;

    private readonly IPromoAdRepository _promoAdRepository;

    private readonly IGeneralDiscountRepository _generalDiscountRepository;



    public StorefrontService(

        IStorefrontRepository storefrontRepository,

        IPromoAdRepository promoAdRepository,

        IGeneralDiscountRepository generalDiscountRepository)

    {

        _storefrontRepository = storefrontRepository;

        _promoAdRepository = promoAdRepository;

        _generalDiscountRepository = generalDiscountRepository;

    }



    public async Task<StorefrontBootstrapDto?> GetBootstrapAsync(string slug, CancellationToken cancellationToken = default)

    {

        var settings = await ResolveSettingsAsync(slug, cancellationToken);

        if (settings is null)

        {

            return null;

        }



        var categories = await _storefrontRepository.GetActiveCategoriesAsync(cancellationToken);

        var products = await _storefrontRepository.GetActiveProductsAsync(cancellationToken);

        var testimonials = await _storefrontRepository.GetActiveTestimonialsAsync(cancellationToken);

        var promoAds = await _promoAdRepository.GetActiveAsync(cancellationToken);

        var discountMap = await BuildProductDiscountMapAsync(settings, cancellationToken);



        return new StorefrontBootstrapDto

        {

            Settings = MapSettings(settings),

            Categories = categories.Select(MapCategory).ToList(),

            Products = products.Select(p => MapProduct(p, discountMap)).ToList(),

            Testimonials = testimonials.Select(MapTestimonial).ToList(),

            PromoAds = promoAds.Take(3).Select(PromoAdService.MapToDto).ToList(),

            Features = SettingsService.MapFeatures(settings)

        };

    }



    public async Task<IReadOnlyList<StorefrontProductDto>> GetProductsAsync(

        string slug,

        int? categoryId = null,

        string? search = null,

        CancellationToken cancellationToken = default)

    {

        var settings = await ResolveSettingsAsync(slug, cancellationToken);

        if (settings is null)

        {

            return [];

        }



        var products = await _storefrontRepository.GetActiveProductsAsync(cancellationToken);

        var discountMap = await BuildProductDiscountMapAsync(settings, cancellationToken);

        IEnumerable<Product> query = products;



        if (categoryId.HasValue)

        {

            query = query.Where(p => p.CategoryId == categoryId.Value);

        }



        if (!string.IsNullOrWhiteSpace(search))

        {

            var term = search.Trim();

            query = query.Where(p =>

                p.Name.Contains(term, StringComparison.OrdinalIgnoreCase));

        }



        return query.Select(p => MapProduct(p, discountMap)).ToList();

    }



    public async Task<StorefrontProductDto?> GetProductAsync(string slug, int id, CancellationToken cancellationToken = default)

    {

        var settings = await ResolveSettingsAsync(slug, cancellationToken);

        if (settings is null)

        {

            return null;

        }



        var product = await _storefrontRepository.GetActiveProductByIdAsync(id, cancellationToken);

        if (product is null)

        {

            return null;

        }



        var discountMap = await BuildProductDiscountMapAsync(settings, cancellationToken);

        return MapProduct(product, discountMap);

    }



    public async Task<IReadOnlyList<PromoAdDto>> GetPromoAdsAsync(string slug, CancellationToken cancellationToken = default)

    {

        if (await ResolveSettingsAsync(slug, cancellationToken) is null)

        {

            return [];

        }



        var ads = await _promoAdRepository.GetActiveAsync(cancellationToken);

        return ads.Select(PromoAdService.MapToDto).ToList();

    }



    private async Task<Dictionary<int, GeneralDiscount>> BuildProductDiscountMapAsync(

        WebsiteSetting settings,

        CancellationToken cancellationToken)

    {

        if (!settings.GeneralDiscountsEnabled)

        {

            return new Dictionary<int, GeneralDiscount>();

        }



        var discounts = await _generalDiscountRepository.GetActiveWithProductsAsync(cancellationToken);

        var map = new Dictionary<int, GeneralDiscount>();



        foreach (var discount in discounts)

        {

            foreach (var product in discount.Products)

            {

                map[product.Id] = discount;

            }

        }



        return map;

    }



    private async Task<WebsiteSetting?> ResolveSettingsAsync(string slug, CancellationToken cancellationToken)

    {

        var settings = await _storefrontRepository.GetSettingsAsync(cancellationToken);

        if (settings is null || !SlugHelper.Matches(settings, slug))

        {

            return null;

        }



        return settings;

    }



    internal static StorefrontSettingsDto MapSettings(WebsiteSetting settings)

    {

        return new StorefrontSettingsDto

        {

            Slug = SlugHelper.FromSettings(settings),

            LogoName = settings.LogoName,

            Logo = settings.LogoUrl,

            Banner = settings.BannerUrl,

            Phone = settings.Phone,

            Facebook = settings.FacebookUrl,

            Instagram = settings.InstagramUrl,

            Twitter = settings.TwitterUrl,

            Tiktok = settings.TikTokUrl

        };

    }



    private static StorefrontCategoryDto MapCategory(Category category)

    {

        return new StorefrontCategoryDto

        {

            Id = category.Id,

            Name = category.Name,

            Image = category.ImageUrl

        };

    }



    private static StorefrontProductDto MapProduct(Product product, Dictionary<int, GeneralDiscount> discountMap)

    {

        discountMap.TryGetValue(product.Id, out var generalDiscount);

        var (effective, _) = ProductPricingHelper.GetEffectiveUnitPrice(product, generalDiscount);



        return new StorefrontProductDto

        {

            Id = product.Id,

            Name = product.Name,

            Details = product.Details,

            CategoryId = product.CategoryId,

            Category = product.Category?.Name ?? string.Empty,

            Brand = product.Brand,

            Price = product.Price,

            SalePrice = product.SalePrice,

            EffectivePrice = effective,

            OnSale = effective < product.Price,

            Quantity = product.Quantity,

            Rating = product.Rating,

            Favorites = product.FavoriteCount,

            Images = product.ProductImages

                .OrderBy(i => i.SortOrder)

                .Select(i => i.ImageUrl)

                .ToList(),

            Attributes = product.AttributeValues

                .Where(v => v.Attribute is not null)

                .GroupBy(v => v.Attribute!.Name)

                .ToDictionary(g => g.Key, g => g.Select(v => v.Value).Distinct().ToList())

        };

    }



    private static StorefrontTestimonialDto MapTestimonial(Testimonial testimonial)

    {

        return new StorefrontTestimonialDto

        {

            Id = testimonial.Id,

            Username = testimonial.Username,

            Rating = testimonial.Rating,

            Comment = testimonial.Comment,

            Image = testimonial.ImageUrl

        };

    }

}


