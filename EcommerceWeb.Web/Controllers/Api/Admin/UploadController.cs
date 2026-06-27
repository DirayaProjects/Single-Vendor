using EcommerceWeb.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EcommerceWeb.Web.Controllers.Api.Admin;

[ApiController]
[Route("api/admin/[controller]")]
public class UploadController : ControllerBase
{
    private const long MaxFileBytes = 10 * 1024 * 1024;

    private readonly IImageStorageService _imageStorageService;

    public UploadController(IImageStorageService imageStorageService)
    {
        _imageStorageService = imageStorageService;
    }

    [HttpPost]
    [RequestSizeLimit(MaxFileBytes)]
    public async Task<IActionResult> Upload(IFormFile file, [FromQuery] string folder = "misc", CancellationToken cancellationToken = default)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "No image file provided." });
        }

        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Only image files are allowed." });
        }

        await using var stream = file.OpenReadStream();
        var urls = await _imageStorageService.SaveAsync(stream, folder, cancellationToken);

        return Ok(new
        {
            thumbUrl = urls.ThumbUrl,
            mediumUrl = urls.MediumUrl,
            largeUrl = urls.LargeUrl
        });
    }
}
