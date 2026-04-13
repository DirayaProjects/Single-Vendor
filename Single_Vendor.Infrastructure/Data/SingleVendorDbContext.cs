using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Single_Vendor.Core.Entities;
using Attribute = Single_Vendor.Core.Entities.Attribute;

namespace Single_Vendor.Infrastructure.Data;

public partial class SingleVendorDbContext : DbContext
{
    public SingleVendorDbContext()
    {
    }

    public SingleVendorDbContext(DbContextOptions<SingleVendorDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AspNetRole> AspNetRoles { get; set; }

    public virtual DbSet<AspNetRoleClaim> AspNetRoleClaims { get; set; }

    public virtual DbSet<AspNetUser> AspNetUsers { get; set; }

    public virtual DbSet<AspNetUserClaim> AspNetUserClaims { get; set; }

    public virtual DbSet<AspNetUserLogin> AspNetUserLogins { get; set; }

    public virtual DbSet<AspNetUserToken> AspNetUserTokens { get; set; }

    public virtual DbSet<Attribute> Attributes { get; set; }

    public virtual DbSet<AttributeValue> AttributeValues { get; set; }

    public virtual DbSet<CartItem> CartItems { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<Order> Orders { get; set; }

    public virtual DbSet<OrderItem> OrderItems { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<ProductImage> ProductImages { get; set; }

    public virtual DbSet<ProductReview> ProductReviews { get; set; }

    public virtual DbSet<ProductSpecification> ProductSpecifications { get; set; }

    public virtual DbSet<PromoCode> PromoCodes { get; set; }

    public virtual DbSet<Store> Stores { get; set; }

    public virtual DbSet<StoreFeatureFlag> StoreFeatureFlags { get; set; }

    public virtual DbSet<StoreSetting> StoreSettings { get; set; }

    public virtual DbSet<StorePromoAd> StorePromoAds { get; set; }

    public virtual DbSet<WishlistItem> WishlistItems { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=localhost\\LocalSQLServer;Database=Single_VendorDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=true");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AspNetRole>(entity =>
        {
            entity.HasIndex(e => e.NormalizedName, "RoleNameIndex")
                .IsUnique()
                .HasFilter("([NormalizedName] IS NOT NULL)");

            entity.Property(e => e.Name).HasMaxLength(256);
            entity.Property(e => e.NormalizedName).HasMaxLength(256);
        });

        modelBuilder.Entity<AspNetRoleClaim>(entity =>
        {
            entity.HasIndex(e => e.RoleId, "IX_AspNetRoleClaims_RoleId");

            entity.HasOne(d => d.Role).WithMany(p => p.AspNetRoleClaims).HasForeignKey(d => d.RoleId);
        });

        modelBuilder.Entity<AspNetUser>(entity =>
        {
            entity.HasIndex(e => e.NormalizedEmail, "EmailIndex");

            entity.HasIndex(e => e.StoreId, "IX_AspNetUsers_StoreId");

            entity.HasIndex(e => e.NormalizedUserName, "UserNameIndex")
                .IsUnique()
                .HasFilter("([NormalizedUserName] IS NOT NULL)");

            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.NormalizedEmail).HasMaxLength(256);
            entity.Property(e => e.NormalizedUserName).HasMaxLength(256);
            entity.Property(e => e.UserName).HasMaxLength(256);

            entity.HasOne(d => d.Store).WithMany(p => p.AspNetUsers)
                .HasForeignKey(d => d.StoreId)
                .HasConstraintName("FK_AspNetUsers_Stores_Customer");

            entity.HasMany(d => d.Roles).WithMany(p => p.Users)
                .UsingEntity<Dictionary<string, object>>(
                    "AspNetUserRole",
                    r => r.HasOne<AspNetRole>().WithMany().HasForeignKey("RoleId"),
                    l => l.HasOne<AspNetUser>().WithMany().HasForeignKey("UserId"),
                    j =>
                    {
                        j.HasKey("UserId", "RoleId");
                        j.ToTable("AspNetUserRoles");
                        j.HasIndex(new[] { "RoleId" }, "IX_AspNetUserRoles_RoleId");
                    });
        });

        modelBuilder.Entity<AspNetUserClaim>(entity =>
        {
            entity.HasIndex(e => e.UserId, "IX_AspNetUserClaims_UserId");

            entity.HasOne(d => d.User).WithMany(p => p.AspNetUserClaims).HasForeignKey(d => d.UserId);
        });

        modelBuilder.Entity<AspNetUserLogin>(entity =>
        {
            entity.HasKey(e => new { e.LoginProvider, e.ProviderKey });

            entity.HasIndex(e => e.UserId, "IX_AspNetUserLogins_UserId");

            entity.Property(e => e.LoginProvider).HasMaxLength(128);
            entity.Property(e => e.ProviderKey).HasMaxLength(128);

            entity.HasOne(d => d.User).WithMany(p => p.AspNetUserLogins).HasForeignKey(d => d.UserId);
        });

        modelBuilder.Entity<AspNetUserToken>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.LoginProvider, e.Name });

            entity.Property(e => e.LoginProvider).HasMaxLength(128);
            entity.Property(e => e.Name).HasMaxLength(128);

            entity.HasOne(d => d.User).WithMany(p => p.AspNetUserTokens).HasForeignKey(d => d.UserId);
        });

        modelBuilder.Entity<Attribute>(entity =>
        {
            entity.HasKey(e => e.AttributeId).HasName("PK__Attribut__C18929EA8643FA79");

            entity.HasIndex(e => e.StoreId, "IX_Attributes_StoreId");

            entity.HasIndex(e => new { e.StoreId, e.Name }, "UX_Attributes_StoreId_Name").IsUnique();

            entity.Property(e => e.CreatedAtUtc).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.DateAdded).HasDefaultValueSql("(CONVERT([date],sysutcdatetime()))");
            entity.Property(e => e.Name).HasMaxLength(200);

            entity.HasOne(d => d.Store).WithMany(p => p.Attributes)
                .HasForeignKey(d => d.StoreId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Attributes_Stores");
        });

        modelBuilder.Entity<AttributeValue>(entity =>
        {
            entity.HasKey(e => e.AttributeValueId).HasName("PK__Attribut__335E22769F4AAF9B");

            entity.HasIndex(e => e.AttributeId, "IX_AttributeValues_AttributeId");

            entity.Property(e => e.Value).HasMaxLength(500);

            entity.HasOne(d => d.Attribute).WithMany(p => p.AttributeValues)
                .HasForeignKey(d => d.AttributeId)
                .HasConstraintName("FK_AttributeValues_Attributes");
        });

        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.ProductId });

            entity.Property(e => e.AddedAtUtc).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Quantity).HasDefaultValue(1);

            entity.HasOne(d => d.Product).WithMany(p => p.CartItems)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("FK_CartItems_Products");

            entity.HasOne(d => d.User).WithMany(p => p.CartItems)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_CartItems_AspNetUsers");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.CategoryId).HasName("PK__Categori__19093A0B4EED65C9");

            entity.HasIndex(e => e.IsActive, "IX_Categories_IsActive");

            entity.HasIndex(e => e.StoreId, "IX_Categories_StoreId");

            entity.HasIndex(e => new { e.StoreId, e.Slug }, "UX_Categories_Store_Slug")
                .IsUnique()
                .HasFilter("([Slug] IS NOT NULL)");

            entity.Property(e => e.CreatedAtUtc).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.ImageUrl).HasMaxLength(1000);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Slug).HasMaxLength(256);

            entity.HasOne(d => d.Store).WithMany(p => p.Categories)
                .HasForeignKey(d => d.StoreId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Categories_Stores");
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.OrderId).HasName("PK__Orders__C3905BCFA427EC02");

            entity.HasIndex(e => e.OrderDate, "IX_Orders_OrderDate").IsDescending();

            entity.HasIndex(e => e.Status, "IX_Orders_Status");

            entity.HasIndex(e => e.StoreId, "IX_Orders_StoreId");

            entity.HasIndex(e => e.UserId, "IX_Orders_UserId");

            entity.Property(e => e.CreatedAtUtc).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.CustomerEmail).HasMaxLength(256);
            entity.Property(e => e.CustomerName).HasMaxLength(200);
            entity.Property(e => e.DeliveryFee).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.OrderDate).HasDefaultValueSql("(CONVERT([date],sysutcdatetime()))");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("Pending");
            entity.Property(e => e.SubTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Total).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Store).WithMany(p => p.Orders)
                .HasForeignKey(d => d.StoreId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Orders_Stores");

            entity.HasOne(d => d.User).WithMany(p => p.Orders)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_Orders_AspNetUsers");
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(e => e.OrderItemId).HasName("PK__OrderIte__57ED06812CAB269B");

            entity.HasIndex(e => e.OrderId, "IX_OrderItems_OrderId");

            entity.Property(e => e.ProductName).HasMaxLength(500);
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Order).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.OrderId)
                .HasConstraintName("FK_OrderItems_Orders");

            entity.HasOne(d => d.Product).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OrderItems_Products");
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.ProductId).HasName("PK__Products__B40CC6CDE42D3474");

            entity.HasIndex(e => e.CategoryId, "IX_Products_CategoryId");

            entity.HasIndex(e => new { e.IsActive, e.Price }, "IX_Products_IsActive_Price");

            entity.HasIndex(e => e.StoreId, "IX_Products_StoreId");

            entity.Property(e => e.Brand).HasMaxLength(200);
            entity.Property(e => e.CreatedAtUtc).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(500);
            entity.Property(e => e.Price).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.RatingAverage).HasColumnType("decimal(3, 2)");

            entity.HasOne(d => d.Category).WithMany(p => p.Products)
                .HasForeignKey(d => d.CategoryId)
                .HasConstraintName("FK_Products_Categories");

            entity.HasOne(d => d.Store).WithMany(p => p.Products)
                .HasForeignKey(d => d.StoreId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Products_Stores");
        });

        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.HasKey(e => e.ProductImageId).HasName("PK__ProductI__07B2B1B8251F6D30");

            entity.HasIndex(e => e.ProductId, "IX_ProductImages_ProductId");

            entity.Property(e => e.ImageUrl).HasMaxLength(1000);

            entity.HasOne(d => d.Product).WithMany(p => p.ProductImages)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("FK_ProductImages_Products");
        });

        modelBuilder.Entity<ProductReview>(entity =>
        {
            entity.HasKey(e => e.ProductReviewId).HasName("PK__ProductR__39631880A5C6BE9E");

            entity.HasIndex(e => e.ProductId, "IX_ProductReviews_ProductId");

            entity.HasIndex(e => e.StoreId, "IX_ProductReviews_StoreId");

            entity.Property(e => e.Comment).HasMaxLength(2000);
            entity.Property(e => e.CreatedAtUtc).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.UserId).HasMaxLength(450);

            entity.HasOne(d => d.Product).WithMany(p => p.ProductReviews)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("FK_Reviews_Products");

            entity.HasOne(d => d.Store).WithMany()
                .HasForeignKey(d => d.StoreId)
                .IsRequired(false)
                .HasConstraintName("FK_ProductReviews_Stores");

            entity.HasOne(d => d.User).WithMany(p => p.ProductReviews)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_Reviews_AspNetUsers");
        });

        modelBuilder.Entity<ProductSpecification>(entity =>
        {
            entity.HasKey(e => new { e.ProductId, e.SpecKey });

            entity.Property(e => e.SpecKey).HasMaxLength(200);
            entity.Property(e => e.SpecValue).HasMaxLength(1000);

            entity.HasOne(d => d.Product).WithMany(p => p.ProductSpecifications)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("FK_ProductSpecifications_Products");
        });

        modelBuilder.Entity<PromoCode>(entity =>
        {
            entity.HasKey(e => e.PromoCodeId).HasName("PK__PromoCod__867BC5861A0383A5");

            entity.HasIndex(e => e.StoreId, "IX_PromoCodes_StoreId");

            entity.HasIndex(e => new { e.StoreId, e.Code }, "UX_PromoCodes_StoreId_Code").IsUnique();

            entity.Property(e => e.Code).HasMaxLength(50);
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.DiscountPercent).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.Store).WithMany(p => p.PromoCodes)
                .HasForeignKey(d => d.StoreId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PromoCodes_Stores");
        });

        modelBuilder.Entity<Store>(entity =>
        {
            entity.HasIndex(e => e.OwnerUserId, "UX_Stores_OwnerUserId")
                .IsUnique()
                .HasFilter("([OwnerUserId] IS NOT NULL)");

            entity.HasIndex(e => e.PublicSlug, "UX_Stores_PublicSlug").IsUnique();

            entity.Property(e => e.CreatedAtUtc).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.DisplayName).HasMaxLength(200);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.PublicSlug).HasMaxLength(100);

            entity.HasOne(d => d.OwnerUser).WithOne(p => p.StoreNavigation)
                .HasForeignKey<Store>(d => d.OwnerUserId)
                .HasConstraintName("FK_Stores_AspNetUsers_Owner");
        });

        modelBuilder.Entity<StoreFeatureFlag>(entity =>
        {
            entity.HasKey(e => e.StoreId);

            entity.Property(e => e.StoreId).ValueGeneratedNever();
            entity.Property(e => e.EnableAdminAttributes).HasDefaultValue(true);
            entity.Property(e => e.EnableAdminOrders).HasDefaultValue(true);
            entity.Property(e => e.EnableAdminSalesAnalytics).HasDefaultValue(true);
            entity.Property(e => e.EnableCustomerProductReviews).HasDefaultValue(true);
            entity.Property(e => e.EnableProductRatingStars).HasDefaultValue(true);
            entity.Property(e => e.EnablePromoAdsSection).HasDefaultValue(true);
            entity.Property(e => e.EnableStorefrontCartCheckout).HasDefaultValue(true);
            entity.Property(e => e.EnableStorefrontTestimonials).HasDefaultValue(true);
            entity.Property(e => e.EnableWishlistFavorites).HasDefaultValue(true);

            entity.HasOne(d => d.Store).WithOne(p => p.StoreFeatureFlag)
                .HasForeignKey<StoreFeatureFlag>(d => d.StoreId)
                .HasConstraintName("FK_StoreFeatureFlags_Stores");
        });

        modelBuilder.Entity<StorePromoAd>(entity =>
        {
            entity.HasKey(e => e.StorePromoAdId).HasName("PK_StorePromoAds");

            entity.HasIndex(e => new { e.StoreId, e.SlotIndex }, "UX_StorePromoAds_Store_Slot").IsUnique();
            entity.HasIndex(e => e.StoreId, "IX_StorePromoAds_StoreId");

            entity.Property(e => e.TitleLine).HasMaxLength(120);
            entity.Property(e => e.BigText).HasMaxLength(50);
            entity.Property(e => e.SubLine).HasMaxLength(120);
            entity.Property(e => e.LinkUrl).HasMaxLength(1000);
            entity.Property(e => e.ImageUrl).HasMaxLength(1000);

            entity.HasOne(d => d.Store).WithMany(p => p.StorePromoAds)
                .HasForeignKey(d => d.StoreId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_StorePromoAds_Stores");
        });

        modelBuilder.Entity<StoreSetting>(entity =>
        {
            entity.HasKey(e => e.StoreId);

            entity.Property(e => e.StoreId).ValueGeneratedNever();
            entity.Property(e => e.AccentColorHex).HasMaxLength(16);
            entity.Property(e => e.BannerUrl).HasMaxLength(1000);
            entity.Property(e => e.BodyBackgroundHex).HasMaxLength(16);
            entity.Property(e => e.ButtonColorHex).HasMaxLength(16);
            entity.Property(e => e.FacebookUrl).HasMaxLength(500);
            entity.Property(e => e.FooterBackgroundHex).HasMaxLength(16);
            entity.Property(e => e.HeaderBackgroundHex).HasMaxLength(16);
            entity.Property(e => e.InstagramUrl).HasMaxLength(500);
            entity.Property(e => e.LinkColorHex).HasMaxLength(16);
            entity.Property(e => e.LogoUrl).HasMaxLength(1000);
            entity.Property(e => e.Phone).HasMaxLength(50);
            entity.Property(e => e.PrimaryColorHex).HasMaxLength(16);
            entity.Property(e => e.SecondaryColorHex).HasMaxLength(16);
            entity.Property(e => e.StoreDisplayName).HasMaxLength(200);
            entity.Property(e => e.TiktokUrl).HasMaxLength(500);
            entity.Property(e => e.TwitterUrl).HasMaxLength(500);

            entity.HasOne(d => d.Store).WithOne(p => p.StoreSetting)
                .HasForeignKey<StoreSetting>(d => d.StoreId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_StoreSettings_Stores");
        });

        modelBuilder.Entity<WishlistItem>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.ProductId });

            entity.Property(e => e.CreatedAtUtc).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Product).WithMany(p => p.WishlistItems)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("FK_Wishlist_Products");

            entity.HasOne(d => d.User).WithMany(p => p.WishlistItems)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_Wishlist_AspNetUsers");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
