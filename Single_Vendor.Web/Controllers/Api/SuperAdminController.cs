using Microsoft.AspNetCore.Authentication.JwtBearer;

using Microsoft.AspNetCore.Authorization;

using Microsoft.AspNetCore.Identity;

using Microsoft.AspNetCore.Mvc;

using Microsoft.EntityFrameworkCore;

using Single_Vendor.Core.Entities;

using Single_Vendor.Infrastructure;

using Single_Vendor.Infrastructure.Data;

using Single_Vendor.Web.Helpers;

using Single_Vendor.Web.Models.Api;



namespace Single_Vendor.Web.Controllers.Api;



/// <summary>Platform owner: manage store Admin accounts (Identity).</summary>

[ApiController]

[Route("api/superadmin")]

[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "SuperAdmin")]

public class SuperAdminController : ControllerBase

{

    private readonly UserManager<IdentityUser> _users;

    private readonly RoleManager<IdentityRole> _roles;

    private readonly ApplicationDbContext _appDb;

    private readonly SingleVendorDbContext _vendorDb;



    public SuperAdminController(

        UserManager<IdentityUser> users,

        RoleManager<IdentityRole> roles,

        ApplicationDbContext appDb,

        SingleVendorDbContext vendorDb)

    {

        _users = users;

        _roles = roles;

        _appDb = appDb;

        _vendorDb = vendorDb;

    }



    [HttpGet("stats")]

    public async Task<ActionResult<SuperAdminStatsResponse>> Stats(CancellationToken cancellationToken)

    {

        var adminRole = await _roles.Roles.AsNoTracking().FirstOrDefaultAsync(r => r.NormalizedName == "ADMIN", cancellationToken);

        var superRole = await _roles.Roles.AsNoTracking().FirstOrDefaultAsync(r => r.NormalizedName == "SUPERADMIN", cancellationToken);

        var customerRole = await _roles.Roles.AsNoTracking().FirstOrDefaultAsync(r => r.NormalizedName == "CUSTOMER", cancellationToken);



        var storeAdminCount = adminRole is null

            ? 0

            : await _appDb.UserRoles.AsNoTracking().CountAsync(ur => ur.RoleId == adminRole.Id, cancellationToken);

        var superAdminCount = superRole is null

            ? 0

            : await _appDb.UserRoles.AsNoTracking().CountAsync(ur => ur.RoleId == superRole.Id, cancellationToken);

        var customerCount = customerRole is null

            ? 0

            : await _appDb.UserRoles.AsNoTracking().CountAsync(ur => ur.RoleId == customerRole.Id, cancellationToken);



        return Ok(new SuperAdminStatsResponse

        {

            StoreAdminCount = storeAdminCount,

            SuperAdminCount = superAdminCount,

            CustomerCount = customerCount

        });

    }



    [HttpGet("admins")]

    public async Task<ActionResult<IReadOnlyList<StoreAdminUserResponse>>> ListStoreAdmins(CancellationToken cancellationToken)

    {

        var users = await _users.GetUsersInRoleAsync("Admin");

        var ids = users.Select(u => u.Id).ToList();

        var stores = await _vendorDb.Stores.AsNoTracking()

            .Where(s => s.OwnerUserId != null && ids.Contains(s.OwnerUserId))

            .ToDictionaryAsync(s => s.OwnerUserId!, s => s, cancellationToken);
        var storeIds = stores.Values.Select(s => s.StoreId).Distinct().ToList();
        var flags = await _vendorDb.StoreFeatureFlags.AsNoTracking()
            .Where(f => storeIds.Contains(f.StoreId))
            .ToDictionaryAsync(f => f.StoreId, f => f, cancellationToken);



        var list = users

            .OrderBy(u => u.Email)

            .Select(u =>
            {
                var store = stores.GetValueOrDefault(u.Id);
                var storeFlags = store is null ? null : flags.GetValueOrDefault(store.StoreId);
                return MapUser(u, store, storeFlags);
            })

            .ToList();

        return Ok(list);

    }



    [HttpPost("admins")]

    public async Task<ActionResult<StoreAdminUserResponse>> CreateStoreAdmin(

        [FromBody] CreateStoreAdminRequest body,

        CancellationToken cancellationToken)

    {

        if (string.IsNullOrWhiteSpace(body.Email))

            return BadRequest("Email is required.");

        if (string.IsNullOrWhiteSpace(body.Password))

            return BadRequest("Password is required.");



        var slug = StoreSlugHelper.NormalizeOrNull(body.PublicSlug);

        if (string.IsNullOrEmpty(slug))

            return BadRequest("PublicSlug is required (letters, digits, hyphen only).");



        if (await _vendorDb.Stores.AnyAsync(s => s.PublicSlug == slug, cancellationToken))

            return Conflict("That store URL slug is already taken.");



        var email = body.Email.Trim();

        if (await _users.FindByEmailAsync(email) is not null)

            return Conflict("A user with this email already exists.");



        if (!await _roles.RoleExistsAsync("Admin"))

            return Problem("Admin role is missing in the database. Run Scripts/SeedIdentityRoles.sql.", statusCode: 500);



        var user = new IdentityUser

        {

            UserName = email,

            Email = email,

            EmailConfirmed = true

        };



        var create = await _users.CreateAsync(user, body.Password);

        if (!create.Succeeded)

            return BadRequest(string.Join(" ", create.Errors.Select(e => e.Description)));



        var addRole = await _users.AddToRoleAsync(user, "Admin");

        if (!addRole.Succeeded)

        {

            await _users.DeleteAsync(user);

            return BadRequest(string.Join(" ", addRole.Errors.Select(e => e.Description)));

        }



        var created = await _users.FindByIdAsync(user.Id);

        if (created is null)

        {

            await _users.DeleteAsync(user);

            return Problem("User was created but could not be reloaded.", statusCode: 500);

        }



        await using var tx = await _vendorDb.Database.BeginTransactionAsync(cancellationToken);

        try

        {

            var display = string.IsNullOrWhiteSpace(body.DisplayName) ? email : body.DisplayName.Trim();

            if (display.Length > 200)

                display = display[..200];



            var store = new Store

            {

                OwnerUserId = created.Id,

                PublicSlug = slug,

                DisplayName = display,

                IsActive = true,

                CreatedAtUtc = DateTime.UtcNow

            };

            _vendorDb.Stores.Add(store);

            await _vendorDb.SaveChangesAsync(cancellationToken);



            _vendorDb.StoreSettings.Add(new StoreSetting

            {

                StoreId = store.StoreId,

                StoreDisplayName = display,

                UpdatedAtUtc = DateTime.UtcNow

            });

            await _vendorDb.SaveChangesAsync(cancellationToken);



            _vendorDb.StoreFeatureFlags.Add(StoreFeaturesMapper.CreateRow(store.StoreId, body.Features));

            await _vendorDb.SaveChangesAsync(cancellationToken);



            var promoNow = DateTime.UtcNow;

            for (byte slot = 1; slot <= 3; slot++)

            {

                _vendorDb.StorePromoAds.Add(new StorePromoAd

                {

                    StoreId = store.StoreId,

                    SlotIndex = slot,

                    TitleLine = "SALE UP TO",

                    BigText = "50%",

                    SubLine = "OFF",

                    IsActive = true,

                    UpdatedAtUtc = promoNow

                });

            }

            await _vendorDb.SaveChangesAsync(cancellationToken);

            await tx.CommitAsync(cancellationToken);

        }

        catch

        {

            await tx.RollbackAsync(cancellationToken);

            await _users.DeleteAsync(created);

            throw;

        }



        var storeRow = await _vendorDb.Stores.AsNoTracking()

            .FirstOrDefaultAsync(s => s.OwnerUserId == created.Id, cancellationToken);



        return Created($"/api/superadmin/admins/{created.Id}", MapUser(created, storeRow));

    }

    [HttpPut("admins/{id}")]
    public async Task<ActionResult<StoreAdminUserResponse>> UpdateStoreAdmin(
        string id,
        [FromBody] UpdateStoreAdminRequest body,
        CancellationToken cancellationToken)
    {
        var user = await _users.FindByIdAsync(id);
        if (user is null)
            return NotFound("Admin user not found.");
        if (!await _users.IsInRoleAsync(user, "Admin"))
            return BadRequest("Target user is not an Admin.");

        var store = await _vendorDb.Stores.FirstOrDefaultAsync(s => s.OwnerUserId == id, cancellationToken);
        if (store is null)
            return Problem("This admin is not linked to a store.", statusCode: 400);

        var slug = StoreSlugHelper.NormalizeOrNull(body.PublicSlug);
        if (string.IsNullOrEmpty(slug))
            return BadRequest("PublicSlug is required (letters, digits, hyphen only).");

        var slugTaken = await _vendorDb.Stores.AsNoTracking()
            .AnyAsync(s => s.StoreId != store.StoreId && s.PublicSlug == slug, cancellationToken);
        if (slugTaken)
            return Conflict("That store URL slug is already taken.");

        var display = string.IsNullOrWhiteSpace(body.DisplayName) ? user.Email : body.DisplayName.Trim();
        if (!string.IsNullOrEmpty(display) && display.Length > 200)
            display = display[..200];

        store.PublicSlug = slug;
        store.DisplayName = display;

        var settings = await _vendorDb.StoreSettings.FirstOrDefaultAsync(s => s.StoreId == store.StoreId, cancellationToken);
        if (settings is null)
        {
            settings = new StoreSetting
            {
                StoreId = store.StoreId
            };
            _vendorDb.StoreSettings.Add(settings);
        }
        settings.StoreDisplayName = display;
        settings.UpdatedAtUtc = DateTime.UtcNow;

        var flagsRow = await _vendorDb.StoreFeatureFlags.FirstOrDefaultAsync(f => f.StoreId == store.StoreId, cancellationToken);
        if (flagsRow is null)
        {
            flagsRow = StoreFeaturesMapper.CreateRow(store.StoreId, body.Features);
            _vendorDb.StoreFeatureFlags.Add(flagsRow);
        }
        else if (body.Features is not null)
        {
            ApplyFeatures(flagsRow, body.Features);
        }

        await _vendorDb.SaveChangesAsync(cancellationToken);

        return Ok(MapUser(user, store, flagsRow));
    }



    private static StoreAdminUserResponse MapUser(IdentityUser u, Store? store, StoreFeatureFlag? flags = null) =>

        new()

        {

            Id = u.Id,

            Email = u.Email,

            UserName = u.UserName,

            EmailConfirmed = u.EmailConfirmed,

            LockoutEnabled = u.LockoutEnabled,

            LockoutEnd = u.LockoutEnd,

            StoreId = store?.StoreId,

            PublicSlug = store?.PublicSlug,
            StoreDisplayName = store?.DisplayName,
            Features = StoreFeaturesMapper.ToResponse(flags)

        };

    private static void ApplyFeatures(StoreFeatureFlag row, StoreFeaturesUpsertDto dto)
    {
        row.EnableProductRatingStars = dto.ProductRatingStars == true;
        row.EnableCustomerProductReviews = dto.CustomerProductReviews == true;
        row.EnableStorefrontTestimonials = dto.StorefrontTestimonials == true;
        row.EnablePromoAdsSection = dto.PromoAdsSection == true;
        row.EnableAdminSalesAnalytics = dto.AdminSalesAnalytics == true;
        row.EnableAdminOrders = dto.AdminOrders == true;
        row.EnableStorefrontCartCheckout = dto.StorefrontCartCheckout == true;
        row.EnableWishlistFavorites = dto.WishlistFavorites == true;
        row.EnableAdminAttributes = dto.AdminAttributes == true;
    }

}

