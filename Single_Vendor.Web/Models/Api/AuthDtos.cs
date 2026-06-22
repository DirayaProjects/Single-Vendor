namespace Single_Vendor.Web.Models.Api;



public sealed class LoginRequest

{

    public string Email { get; set; } = "";

    public string Password { get; set; } = "";



    /// <summary>For customers: must match the store they registered on.</summary>

    public string? StoreSlug { get; set; }

}



public sealed class LoginResponse

{

    public string Token { get; set; } = "";

    public string Email { get; set; } = "";

    public IReadOnlyList<string> Roles { get; set; } = Array.Empty<string>();

}



public sealed class RegisterRequest

{

    public string Email { get; set; } = "";

    public string Password { get; set; } = "";

    public string? StoreSlug { get; set; }

}

