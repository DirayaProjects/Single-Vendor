using EcommerceWeb.Application.Dtos;

using EcommerceWeb.Application.Helpers;

using EcommerceWeb.Application.Interfaces;

using EcommerceWeb.Core.Entities;

using EcommerceWeb.Core.Interfaces;



namespace EcommerceWeb.Application.Services;



public class CheckoutService : ICheckoutService

{

    private readonly ICartRepository _cartRepository;

    private readonly IOrderRepository _orderRepository;

    private readonly IAuthRepository _authRepository;

    private readonly ISettingsRepository _settingsRepository;

    private readonly IDeliveryCityRepository _deliveryCityRepository;

    private readonly IUserProfileRepository _userProfileRepository;

    private readonly ISpinWheelRepository _spinWheelRepository;

    private readonly IGeneralDiscountRepository _generalDiscountRepository;



    public CheckoutService(

        ICartRepository cartRepository,

        IOrderRepository orderRepository,

        IAuthRepository authRepository,

        ISettingsRepository settingsRepository,

        IDeliveryCityRepository deliveryCityRepository,

        IUserProfileRepository userProfileRepository,

        ISpinWheelRepository spinWheelRepository,

        IGeneralDiscountRepository generalDiscountRepository)

    {

        _cartRepository = cartRepository;

        _orderRepository = orderRepository;

        _authRepository = authRepository;

        _settingsRepository = settingsRepository;

        _deliveryCityRepository = deliveryCityRepository;

        _userProfileRepository = userProfileRepository;

        _spinWheelRepository = spinWheelRepository;

        _generalDiscountRepository = generalDiscountRepository;

    }



    public Task<CheckoutPreviewDto> PreviewAsync(CheckoutRequestDto dto, CancellationToken cancellationToken = default)

        => BuildPreviewAsync(dto, cancellationToken);



    public async Task<CheckoutResultDto> CheckoutAsync(CheckoutRequestDto dto, CancellationToken cancellationToken = default)

    {

        ValidateCustomerFields(dto);

        await EnsureCustomerUser(dto.UserId, cancellationToken);



        var cartItems = await _cartRepository.GetByUserIdAsync(dto.UserId, cancellationToken);

        if (cartItems.Count == 0)

        {

            throw new InvalidOperationException("Your cart is empty.");

        }



        var preview = await BuildPreviewAsync(dto, cancellationToken);

        var city = await _deliveryCityRepository.GetByIdAsync(dto.DeliveryCityId, cancellationToken)

            ?? throw new InvalidOperationException("Delivery city not found.");



        if (!city.IsActive)

        {

            throw new InvalidOperationException("Selected delivery city is not available.");

        }



        var productDiscountMap = await BuildProductDiscountMapAsync(cancellationToken);

        var orderItems = new List<OrderItem>();

        decimal productSaleDiscount = 0;

        decimal generalDiscountTotal = 0;



        foreach (var item in cartItems)

        {

            productDiscountMap.TryGetValue(item.ProductId, out var generalDiscount);

            var (effective, savings) = ProductPricingHelper.GetEffectiveUnitPrice(item.Product, generalDiscount);

            var original = item.Product.Price;

            var salePart = item.Product.SalePrice is > 0 and var sp && sp < original ? original - sp : 0;

            var generalPart = Math.Max(0, savings - salePart);



            productSaleDiscount += salePart * item.Quantity;

            generalDiscountTotal += generalPart * item.Quantity;



            orderItems.Add(new OrderItem

            {

                ProductId = item.ProductId,

                ProductName = item.Product.Name,

                UnitPrice = effective,

                OriginalUnitPrice = original,

                Quantity = item.Quantity,

                LineTotal = effective * item.Quantity

            });

        }



        var settings = await _settingsRepository.GetAsync(cancellationToken);

        var profile = await _userProfileRepository.GetByUserIdAsync(dto.UserId, cancellationToken);

        var subTotal = orderItems.Sum(i => i.LineTotal);



        var spinDiscount = 0m;

        var firstOrderDiscount = 0m;

        int? spinPrizeId = null;

        int? spinResultId = null;



        (spinDiscount, firstOrderDiscount, spinPrizeId, spinResultId) = await ResolveOrderLevelDiscountsAsync(

            settings,

            profile,

            dto.UserId,

            subTotal,

            dto.ApplySpinWheelPrize,

            cancellationToken);



        var totalDiscount = productSaleDiscount + generalDiscountTotal + spinDiscount + firstOrderDiscount;

        var total = Math.Max(0, subTotal - spinDiscount - firstOrderDiscount) + city.DeliveryFee;



        var order = new Order

        {

            UserId = dto.UserId,

            Status = "Pending",

            SubTotal = subTotal,

            Discount = totalDiscount,

            ProductSaleDiscount = productSaleDiscount,

            GeneralDiscount = generalDiscountTotal,

            SpinWheelDiscount = spinDiscount,

            FirstOrderDiscount = firstOrderDiscount,

            DeliveryFee = city.DeliveryFee,

            Total = total,

            CustomerName = dto.CustomerName.Trim(),

            CustomerPhone = dto.CustomerPhone.Trim(),

            CustomerEmail = dto.CustomerEmail.Trim(),

            CustomerAddress = dto.CustomerAddress.Trim(),

            DeliveryCityId = city.Id,

            DeliveryCityName = city.Name,

            SpinWheelPrizeId = spinPrizeId,

            Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),

            OrderDate = DateTime.UtcNow

        };



        var created = await _orderRepository.CreateWithItemsAsync(order, orderItems, cancellationToken);

        await _cartRepository.ClearAsync(dto.UserId, cancellationToken);



        if (spinResultId.HasValue)

        {

            await _spinWheelRepository.MarkResultUsedAsync(spinResultId.Value, created.Id, cancellationToken);

        }



        if (firstOrderDiscount > 0)

        {

            await _userProfileRepository.MarkFirstOrderDiscountUsedAsync(dto.UserId, cancellationToken);

        }



        return new CheckoutResultDto

        {

            OrderId = created.Id,

            Status = created.Status,

            SubTotal = created.SubTotal,

            DeliveryFee = created.DeliveryFee,

            Total = created.Total,

            Date = created.OrderDate.ToString("yyyy-MM-dd")

        };

    }



    private async Task<CheckoutPreviewDto> BuildPreviewAsync(CheckoutRequestDto dto, CancellationToken cancellationToken)

    {

        await EnsureCustomerUser(dto.UserId, cancellationToken);



        var cartItems = await _cartRepository.GetByUserIdAsync(dto.UserId, cancellationToken);

        var productDiscountMap = await BuildProductDiscountMapAsync(cancellationToken);

        var settings = await _settingsRepository.GetAsync(cancellationToken);

        var profile = await _userProfileRepository.GetByUserIdAsync(dto.UserId, cancellationToken);



        decimal subTotal = 0;

        decimal productSaleDiscount = 0;

        decimal generalDiscount = 0;



        foreach (var item in cartItems)

        {

            productDiscountMap.TryGetValue(item.ProductId, out var gd);

            var (effective, savings) = ProductPricingHelper.GetEffectiveUnitPrice(item.Product, gd);

            var original = item.Product.Price;

            var salePart = item.Product.SalePrice is > 0 and var sp && sp < original ? original - sp : 0;

            var generalPart = Math.Max(0, savings - salePart);



            subTotal += effective * item.Quantity;

            productSaleDiscount += salePart * item.Quantity;

            generalDiscount += generalPart * item.Quantity;

        }



        DeliveryCity? city = null;

        if (dto.DeliveryCityId > 0)

        {

            city = await _deliveryCityRepository.GetByIdAsync(dto.DeliveryCityId, cancellationToken);

        }



        var spinDiscount = 0m;

        var firstOrderDiscount = 0m;

        var hasUnusedSpin = false;

        var eligibleFirstOrder = false;



        int? spinPrizeId = null;

        int? spinResultId = null;

        (spinDiscount, firstOrderDiscount, spinPrizeId, spinResultId) = await ResolveOrderLevelDiscountsAsync(

            settings,

            profile,

            dto.UserId,

            subTotal,

            dto.ApplySpinWheelPrize,

            cancellationToken);

        hasUnusedSpin = spinPrizeId.HasValue;

        eligibleFirstOrder = firstOrderDiscount > 0;



        var deliveryFee = city?.DeliveryFee ?? 0;

        var orderLevelDiscount = spinDiscount + firstOrderDiscount;

        var total = Math.Max(0, subTotal - orderLevelDiscount) + deliveryFee;



        return new CheckoutPreviewDto

        {

            SubTotal = subTotal,

            ProductSaleDiscount = productSaleDiscount,

            GeneralDiscount = generalDiscount,

            SpinWheelDiscount = spinDiscount,

            FirstOrderDiscount = firstOrderDiscount,

            TotalDiscount = productSaleDiscount + generalDiscount + orderLevelDiscount,

            DeliveryFee = deliveryFee,

            Total = total,

            DeliveryCityName = city?.Name,

            HasUnusedSpinPrize = hasUnusedSpin,

            EligibleForFirstOrderDiscount = eligibleFirstOrder

        };

    }



    private async Task<Dictionary<int, GeneralDiscount>> BuildProductDiscountMapAsync(CancellationToken cancellationToken)

    {

        var settings = await _settingsRepository.GetAsync(cancellationToken);

        if (settings?.GeneralDiscountsEnabled != true)

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



    private async Task<(decimal SpinDiscount, decimal FirstOrderDiscount, int? SpinPrizeId, int? SpinResultId)> ResolveOrderLevelDiscountsAsync(

        WebsiteSetting? settings,

        UserProfile? profile,

        string userId,

        decimal subTotal,

        bool applySpinWheelPrize,

        CancellationToken cancellationToken)

    {

        decimal spinDiscount = 0;

        decimal firstOrderDiscount = 0;

        int? spinPrizeId = null;

        int? spinResultId = null;



        if (settings?.SpinWheelEnabled == true && applySpinWheelPrize)

        {

            var unused = await _spinWheelRepository.GetUnusedResultAsync(userId, cancellationToken);

            if (unused?.SpinWheelPrize is not null)

            {

                spinDiscount = ProductPricingHelper.CalculateOrderLevelDiscount(

                    subTotal,

                    unused.SpinWheelPrize.DiscountPercent,

                    unused.SpinWheelPrize.DiscountAmount);

                spinPrizeId = unused.SpinWheelPrizeId;

                spinResultId = unused.Id;

            }

        }



        if (spinDiscount <= 0

            && settings?.FirstOrderDiscountEnabled == true

            && profile?.FirstOrderDiscountUsed != true

            && !await _userProfileRepository.HasPlacedOrderAsync(userId, cancellationToken))

        {

            firstOrderDiscount = ProductPricingHelper.CalculateOrderLevelDiscount(

                subTotal,

                settings.FirstOrderDiscountPercent,

                settings.FirstOrderDiscountAmount);

        }



        return (spinDiscount, firstOrderDiscount, spinPrizeId, spinResultId);

    }



    private async Task EnsureCustomerUser(string userId, CancellationToken cancellationToken)

    {

        var user = await _authRepository.GetByIdAsync(userId, cancellationToken);

        if (user is null)

        {

            throw new InvalidOperationException("User not found.");

        }



        var roles = await _authRepository.GetUserRolesAsync(userId, cancellationToken);

        if (roles.Any(r => string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase)))

        {

            throw new InvalidOperationException("Admins cannot place customer orders.");

        }

    }



    private static void ValidateCustomerFields(CheckoutRequestDto dto)

    {

        if (string.IsNullOrWhiteSpace(dto.CustomerName)

            || string.IsNullOrWhiteSpace(dto.CustomerPhone)

            || string.IsNullOrWhiteSpace(dto.CustomerEmail)

            || string.IsNullOrWhiteSpace(dto.CustomerAddress)

            || dto.DeliveryCityId <= 0)

        {

            throw new InvalidOperationException("Name, phone, email, address, and delivery city are required.");

        }

    }

}


