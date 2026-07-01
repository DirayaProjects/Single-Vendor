namespace EcommerceWeb.Application.Dtos;

public class SaveSettingsDto
{
    public string? LogoName { get; set; }

    public string? Logo { get; set; }

    public string? Banner { get; set; }

    public string? Phone { get; set; }

    public string? Facebook { get; set; }

    public string? Instagram { get; set; }

    public string? Twitter { get; set; }

    public string? Tiktok { get; set; }

    public FeatureSettingsDto Features { get; set; } = new();
}
