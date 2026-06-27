namespace EcommerceWeb.Application.Dtos;

public class StorefrontBootstrapDto
{
    public StorefrontSettingsDto Settings { get; set; } = null!;

    public List<StorefrontCategoryDto> Categories { get; set; } = [];

    public List<StorefrontProductDto> Products { get; set; } = [];

    public List<StorefrontTestimonialDto> Testimonials { get; set; } = [];
}
