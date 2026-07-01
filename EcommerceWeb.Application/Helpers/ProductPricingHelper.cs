using EcommerceWeb.Application.Helpers;
using EcommerceWeb.Core.Entities;

namespace EcommerceWeb.Application.Helpers;

public static class ProductPricingHelper
{
    public static bool IsDiscountActive(GeneralDiscount discount, DateTime utcNow)
    {
        if (!discount.IsActive)
        {
            return false;
        }

        if (discount.StartDate.HasValue && discount.StartDate.Value > utcNow)
        {
            return false;
        }

        if (discount.EndDate.HasValue && discount.EndDate.Value < utcNow)
        {
            return false;
        }

        return true;
    }

    public static bool IsPromoAdActive(PromoAd ad, DateTime utcNow)
    {
        if (!ad.IsActive)
        {
            return false;
        }

        if (ad.StartDate.HasValue && ad.StartDate.Value > utcNow)
        {
            return false;
        }

        if (ad.EndDate.HasValue && ad.EndDate.Value < utcNow)
        {
            return false;
        }

        return true;
    }

    public static decimal ApplyDiscount(decimal amount, decimal? percent, decimal? fixedAmount)
    {
        var discounted = amount;

        if (percent is > 0)
        {
            discounted = Math.Round(amount * (1 - percent.Value / 100m), 2, MidpointRounding.AwayFromZero);
        }

        if (fixedAmount is > 0)
        {
            discounted = Math.Round(Math.Max(0, amount - fixedAmount.Value), 2, MidpointRounding.AwayFromZero);
        }

        return Math.Max(0, discounted);
    }

    public static decimal GetGeneralDiscountPrice(decimal price, GeneralDiscount discount)
    {
        return ApplyDiscount(price, discount.DiscountPercent, discount.DiscountAmount);
    }

    public static (decimal EffectivePrice, decimal Savings) GetEffectiveUnitPrice(
        Product product,
        GeneralDiscount? generalDiscount)
    {
        var original = product.Price;
        var candidates = new List<decimal> { original };

        if (product.SalePrice is > 0 and var sale && sale < original)
        {
            candidates.Add(sale);
        }

        if (generalDiscount is not null && IsDiscountActive(generalDiscount, DateTime.UtcNow))
        {
            var generalPrice = GetGeneralDiscountPrice(original, generalDiscount);
            if (generalPrice < original)
            {
                candidates.Add(generalPrice);
            }
        }

        var effective = candidates.Min();
        return (effective, original - effective);
    }

    public static decimal CalculateOrderLevelDiscount(
        decimal subtotal,
        decimal? percent,
        decimal? amount)
    {
        if (subtotal <= 0)
        {
            return 0;
        }

        if (percent is > 0)
        {
            return Math.Round(subtotal * percent.Value / 100m, 2, MidpointRounding.AwayFromZero);
        }

        if (amount is > 0)
        {
            return Math.Min(subtotal, amount.Value);
        }

        return 0;
    }
}
