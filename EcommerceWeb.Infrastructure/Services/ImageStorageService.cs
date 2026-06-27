using EcommerceWeb.Core.Interfaces;
using Microsoft.AspNetCore.Hosting;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace EcommerceWeb.Infrastructure.Services;

public class ImageStorageService : IImageStorageService
{
    private const int ThumbSize = 150;
    private const int MediumSize = 600;
    private const int LargeSize = 1200;

    private readonly IWebHostEnvironment _environment;

    public ImageStorageService(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<ImageSizeUrls> SaveAsync(Stream input, string folder, CancellationToken cancellationToken = default)
    {
        var safeFolder = SanitizeFolder(folder);
        var imageId = Guid.NewGuid().ToString("N");
        var relativeBase = $"/uploads/{safeFolder}/{imageId}";
        var absoluteDir = Path.Combine(_envWebRoot(), "uploads", safeFolder, imageId);

        Directory.CreateDirectory(absoluteDir);

        using var image = await Image.LoadAsync(input, cancellationToken);

        await SaveVariantAsync(image, absoluteDir, "thumb.webp", ThumbSize, cancellationToken);
        await SaveVariantAsync(image, absoluteDir, "medium.webp", MediumSize, cancellationToken);
        await SaveVariantAsync(image, absoluteDir, "large.webp", LargeSize, cancellationToken);

        return new ImageSizeUrls(
            $"{relativeBase}/thumb.webp",
            $"{relativeBase}/medium.webp",
            $"{relativeBase}/large.webp");
    }

    public Task DeleteAsync(ImageSizeUrls urls, CancellationToken cancellationToken = default)
    {
        var directory = GetDirectoryFromMediumUrl(urls.MediumUrl);
        if (directory is not null && Directory.Exists(directory))
        {
            Directory.Delete(directory, recursive: true);
        }

        return Task.CompletedTask;
    }

    private string _envWebRoot() =>
        _environment.WebRootPath
        ?? throw new InvalidOperationException("Web root path is not configured.");

    private static string SanitizeFolder(string folder)
    {
        var cleaned = new string(folder
            .Trim()
            .ToLowerInvariant()
            .Where(ch => char.IsLetterOrDigit(ch) || ch is '-' or '_')
            .ToArray());

        return string.IsNullOrWhiteSpace(cleaned) ? "misc" : cleaned;
    }

    private static async Task SaveVariantAsync(
        Image source,
        string absoluteDir,
        string fileName,
        int maxSize,
        CancellationToken cancellationToken)
    {
        using var clone = source.Clone(ctx => ctx.Resize(new ResizeOptions
        {
            Mode = ResizeMode.Max,
            Size = new Size(maxSize, maxSize)
        }));

        var encoder = new WebpEncoder { Quality = 82 };
        var path = Path.Combine(absoluteDir, fileName);
        await clone.SaveAsync(path, encoder, cancellationToken);
    }

    private string? GetDirectoryFromMediumUrl(string mediumUrl)
    {
        if (string.IsNullOrWhiteSpace(mediumUrl) || !mediumUrl.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var relative = mediumUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var filePath = Path.Combine(_envWebRoot(), relative);
        return Path.GetDirectoryName(filePath);
    }
}
