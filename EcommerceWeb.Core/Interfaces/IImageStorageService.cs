namespace EcommerceWeb.Core.Interfaces;

public record ImageSizeUrls(string ThumbUrl, string MediumUrl, string LargeUrl);

public interface IImageStorageService
{
    Task<ImageSizeUrls> SaveAsync(Stream input, string folder, CancellationToken cancellationToken = default);

    Task DeleteAsync(ImageSizeUrls urls, CancellationToken cancellationToken = default);
}
