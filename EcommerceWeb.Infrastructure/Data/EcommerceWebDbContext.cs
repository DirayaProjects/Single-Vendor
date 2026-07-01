using System;
using System.Collections.Generic;
using EcommerceWeb.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Attribute = EcommerceWeb.Core.Entities.Attribute;

namespace EcommerceWeb.Infrastructure.Data;

public partial class EcommerceWebDbContext : DbContext
{
    public EcommerceWebDbContext()
    {
    }

    public EcommerceWebDbContext(DbContextOptions<EcommerceWebDbContext> options)
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

    public virtual DbSet<DeliveryCity> DeliveryCities { get; set; }

    public virtual DbSet<Favorite> Favorites { get; set; }

    public virtual DbSet<GeneralDiscount> GeneralDiscounts { get; set; }

    public virtual DbSet<Order> Orders { get; set; }

    public virtual DbSet<OrderItem> OrderItems { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<ProductImage> ProductImages { get; set; }

    public virtual DbSet<PromoAd> PromoAds { get; set; }

    public virtual DbSet<PromoCode> PromoCodes { get; set; }

    public virtual DbSet<SpinWheelPrize> SpinWheelPrizes { get; set; }

    public virtual DbSet<Testimonial> Testimonials { get; set; }

    public virtual DbSet<UserProfile> UserProfiles { get; set; }

    public virtual DbSet<UserSpinWheelResult> UserSpinWheelResults { get; set; }

    public virtual DbSet<WebsiteSetting> WebsiteSettings { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=localhost\\LocalSQLServer;Database=EcommerceWebDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=true");

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

            entity.HasIndex(e => e.NormalizedUserName, "UserNameIndex")
                .IsUnique()
                .HasFilter("([NormalizedUserName] IS NOT NULL)");

            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.NormalizedEmail).HasMaxLength(256);
            entity.Property(e => e.NormalizedUserName).HasMaxLength(256);
            entity.Property(e => e.UserName).HasMaxLength(256);

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
            entity.HasKey(e => e.Id).HasName("PK__Attribut__3214EC07419A6921");

            entity.HasIndex(e => e.Name, "UQ__Attribut__737584F65C0B7546").IsUnique();

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<AttributeValue>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Attribut__3214EC071702D24E");

            entity.HasIndex(e => new { e.AttributeId, e.Value }, "UQ_AttributeValues").IsUnique();

            entity.Property(e => e.Value).HasMaxLength(100);

            entity.HasOne(d => d.Attribute).WithMany(p => p.AttributeValues)
                .HasForeignKey(d => d.AttributeId)
                .HasConstraintName("FK_AttributeValues_Attributes");
        });

        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__CartItem__3214EC074F59E251");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Quantity).HasDefaultValue(1);
            entity.Property(e => e.SelectedAttributes).HasDefaultValue("{}");

            entity.HasOne(d => d.Product).WithMany(p => p.CartItems)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CartItems_Products");

            entity.HasOne(d => d.User).WithMany(p => p.CartItems)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_CartItems_AspNetUsers");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Categori__3214EC07A95A402C");

            entity.HasIndex(e => e.Name, "UQ__Categori__737584F6146FD37F").IsUnique();

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.ImageUrl).HasMaxLength(1000);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<DeliveryCity>(entity =>
        {
            entity.HasIndex(e => new { e.IsActive, e.SortOrder, e.Name }, "IX_DeliveryCities_Active_Sort");

            entity.HasIndex(e => e.Name, "UQ_DeliveryCities_Name").IsUnique();

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.DeliveryFee).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<Favorite>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.ProductId }).HasName("PK__Favorite__DCC800204FF69E8F");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Product).WithMany(p => p.Favorites)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("FK_Favorites_Products");

            entity.HasOne(d => d.User).WithMany(p => p.Favorites)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_Favorites_AspNetUsers");
        });

        modelBuilder.Entity<GeneralDiscount>(entity =>
        {
            entity.HasIndex(e => new { e.IsActive, e.StartDate, e.EndDate }, "IX_GeneralDiscounts_Active_Dates");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.DiscountPercent).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(150);

            entity.HasMany(d => d.Products).WithMany(p => p.GeneralDiscounts)
                .UsingEntity<Dictionary<string, object>>(
                    "GeneralDiscountProduct",
                    r => r.HasOne<Product>().WithMany()
                        .HasForeignKey("ProductId")
                        .HasConstraintName("FK_GDP_Products"),
                    l => l.HasOne<GeneralDiscount>().WithMany()
                        .HasForeignKey("GeneralDiscountId")
                        .HasConstraintName("FK_GDP_GeneralDiscounts"),
                    j =>
                    {
                        j.HasKey("GeneralDiscountId", "ProductId");
                        j.ToTable("GeneralDiscountProducts");
                        j.HasIndex(new[] { "ProductId" }, "IX_GeneralDiscountProducts_Product");
                    });
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Orders__3214EC079641062C");

            entity.Property(e => e.CustomerAddress).HasMaxLength(500);
            entity.Property(e => e.CustomerEmail).HasMaxLength(256);
            entity.Property(e => e.CustomerName).HasMaxLength(150);
            entity.Property(e => e.CustomerPhone).HasMaxLength(30);
            entity.Property(e => e.DeliveryCityName).HasMaxLength(100);
            entity.Property(e => e.DeliveryFee).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Discount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.FirstOrderDiscount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.GeneralDiscount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.OrderDate).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.ProductSaleDiscount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.SpinWheelDiscount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.SubTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Total).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UserId).HasMaxLength(450);

            entity.HasOne(d => d.DeliveryCity).WithMany(p => p.Orders)
                .HasForeignKey(d => d.DeliveryCityId)
                .HasConstraintName("FK_Orders_DeliveryCities");

            entity.HasOne(d => d.PromoCode).WithMany(p => p.Orders)
                .HasForeignKey(d => d.PromoCodeId)
                .HasConstraintName("FK_Orders_PromoCodes");

            entity.HasOne(d => d.SpinWheelPrize).WithMany(p => p.Orders)
                .HasForeignKey(d => d.SpinWheelPrizeId)
                .HasConstraintName("FK_Orders_SpinWheelPrizes");

            entity.HasOne(d => d.User).WithMany(p => p.Orders)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Orders_AspNetUsers");
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__OrderIte__3214EC07DC2D6EDC");

            entity.Property(e => e.LineTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.OriginalUnitPrice).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.ProductName).HasMaxLength(200);
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
            entity.HasKey(e => e.Id).HasName("PK__Products__3214EC0781CC888E");

            entity.Property(e => e.Brand).HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Price).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Rating).HasColumnType("decimal(3, 2)");
            entity.Property(e => e.SalePrice).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Category).WithMany(p => p.Products)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Products_Categories");

            entity.HasMany(d => d.AttributeValues).WithMany(p => p.Products)
                .UsingEntity<Dictionary<string, object>>(
                    "ProductAttributeValue",
                    r => r.HasOne<AttributeValue>().WithMany()
                        .HasForeignKey("AttributeValueId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK_PAV_AttributeValues"),
                    l => l.HasOne<Product>().WithMany()
                        .HasForeignKey("ProductId")
                        .HasConstraintName("FK_PAV_Products"),
                    j =>
                    {
                        j.HasKey("ProductId", "AttributeValueId").HasName("PK__ProductA__C73924EA233C4B77");
                        j.ToTable("ProductAttributeValues");
                    });
        });

        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ProductI__3214EC07915C2361");

            entity.Property(e => e.ImageUrl).HasMaxLength(1000);

            entity.HasOne(d => d.Product).WithMany(p => p.ProductImages)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("FK_ProductImages_Products");
        });

        modelBuilder.Entity<PromoAd>(entity =>
        {
            entity.HasIndex(e => new { e.IsActive, e.SortOrder, e.Id }, "IX_PromoAds_Active_Sort");

            entity.Property(e => e.ButtonText).HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.ImageUrl).HasMaxLength(1000);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.LinkUrl).HasMaxLength(500);
            entity.Property(e => e.Subtitle).HasMaxLength(300);
            entity.Property(e => e.Title).HasMaxLength(200);
        });

        modelBuilder.Entity<PromoCode>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__PromoCod__3214EC072A7EA409");

            entity.HasIndex(e => e.Code, "UQ__PromoCod__A25C5AA7248A990B").IsUnique();

            entity.Property(e => e.Code).HasMaxLength(50);
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.DiscountPercent).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<SpinWheelPrize>(entity =>
        {
            entity.HasIndex(e => new { e.IsActive, e.SortOrder, e.Id }, "IX_SpinWheelPrizes_Active_Sort");

            entity.Property(e => e.Color).HasMaxLength(20);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.DiscountPercent).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Label).HasMaxLength(100);
            entity.Property(e => e.Weight).HasDefaultValue(1);
        });

        modelBuilder.Entity<Testimonial>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Testimon__3214EC07A3E8ECA6");

            entity.Property(e => e.Comment).HasMaxLength(1000);
            entity.Property(e => e.ImageUrl).HasMaxLength(1000);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Rating).HasColumnType("decimal(3, 2)");
            entity.Property(e => e.Username).HasMaxLength(100);
        });

        modelBuilder.Entity<UserProfile>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__UserProf__1788CC4CE39C4B5F");

            entity.Property(e => e.AvatarUrl).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.FullName).HasMaxLength(150);

            entity.HasOne(d => d.User).WithOne(p => p.UserProfile)
                .HasForeignKey<UserProfile>(d => d.UserId)
                .HasConstraintName("FK_UserProfiles_AspNetUsers");
        });

        modelBuilder.Entity<UserSpinWheelResult>(entity =>
        {
            entity.HasIndex(e => new { e.UserId, e.IsUsed, e.WonAt }, "IX_UserSpinWheelResults_User_Unused").IsDescending(false, false, true);

            entity.Property(e => e.WonAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.SpinWheelPrize).WithMany(p => p.UserSpinWheelResults)
                .HasForeignKey(d => d.SpinWheelPrizeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UserSpinWheelResults_SpinWheelPrizes");

            entity.HasOne(d => d.UsedOnOrder).WithMany(p => p.UserSpinWheelResults)
                .HasForeignKey(d => d.UsedOnOrderId)
                .HasConstraintName("FK_UserSpinWheelResults_Orders");

            entity.HasOne(d => d.User).WithMany(p => p.UserSpinWheelResults)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_UserSpinWheelResults_AspNetUsers");
        });

        modelBuilder.Entity<WebsiteSetting>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__WebsiteS__3214EC076233AB1D");

            entity.Property(e => e.BannerUrl).HasMaxLength(1000);
            entity.Property(e => e.FacebookUrl).HasMaxLength(300);
            entity.Property(e => e.FirstOrderDiscountAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.FirstOrderDiscountEnabled).HasDefaultValue(true);
            entity.Property(e => e.FirstOrderDiscountPercent).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.InstagramUrl).HasMaxLength(300);
            entity.Property(e => e.LogoName).HasMaxLength(150);
            entity.Property(e => e.LogoUrl).HasMaxLength(1000);
            entity.Property(e => e.Phone).HasMaxLength(30);
            entity.Property(e => e.TikTokUrl).HasMaxLength(300);
            entity.Property(e => e.TwitterUrl).HasMaxLength(300);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
