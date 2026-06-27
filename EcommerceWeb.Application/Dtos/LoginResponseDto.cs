namespace EcommerceWeb.Application.Dtos;

public class LoginResponseDto
{
    public bool Success { get; set; }

    public string? Message { get; set; }

    public string? UserId { get; set; }

    public string? Email { get; set; }

    public string? UserName { get; set; }

    public IReadOnlyList<string> Roles { get; set; } = [];

    public bool IsAdmin { get; set; }

    public string? RedirectUrl { get; set; }
}
