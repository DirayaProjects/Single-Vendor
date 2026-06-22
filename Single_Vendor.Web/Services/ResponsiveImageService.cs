using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace Single_Vendor.Web.Services;

public sealed class ResponsiveImageService
{
    private static readonly (string Suffix, int Width)[] Sizes =
    {
        ("sm", 480),
        ("md", 960),
        ("lg", 1600)
    };

    public async Task<string> SaveWebpVariantsAsync(
        IFormFile file,
        string webRootPath,
        string relativeFolder,
        string fileBaseName,
        PathString requestPathBase,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            throw new InvalidOperationException("File required.");

        var safeFolder = relativeFolder.Trim('/').Replace('\\', '/');
        var outputDir = Path.Combine(webRootPath, safeFolder.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(outputDir);

        await using var input = file.OpenReadStream();
        using var source = await Image.LoadAsync(input, cancellationToken);

        foreach (var (suffix, width) in Sizes)
        {
            using var variant = source.Clone(ctx =>
            {
                var targetWidth = Math.Min(width, source.Width);
                ctx.Resize(new ResizeOptions
                {
                    Mode = ResizeMode.Max,
                    Size = new Size(targetWidth, 0)
                });
            });

            var outputPath = Path.Combine(outputDir, $"{fileBaseName}-{suffix}.webp");
            await variant.SaveAsync(outputPath, new WebpEncoder { Quality = 82 }, cancellationToken);
        }

        var prefix = requestPathBase.HasValue ? requestPathBase.Value : string.Empty;
        var url = $"{prefix}/{safeFolder}/{fileBaseName}-md.webp".Replace("//", "/");
        return url.StartsWith('/') ? url : "/" + url;
    }
}
