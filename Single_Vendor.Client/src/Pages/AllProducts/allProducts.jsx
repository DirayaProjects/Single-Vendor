import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import "./allProducts.css";
import Header from "../../components/Header/header";
import Footer from "../../components/Footer/footer";
import { FaHeart } from "react-icons/fa";
import { Link, useSearchParams } from "react-router-dom";
import { useStoreSlug } from "../../hooks/useStoreSlug";
import {
  fetchStorefrontProducts,
  fetchStorefrontCategories,
  fetchStorefrontPromoAds,
} from "../../services/storefrontApi";
import { resolveMediaUrl, resolveResponsiveMedia } from "../../utils/mediaUrl";
import { useCart } from "../../contexts/CartContext";
import { useStorefrontSettings } from "../../contexts/StorefrontSettingsContext";
import ProductStars from "../../components/ProductStars/ProductStars";
import { useWishlist } from "../../hooks/useWishlist";
import { getUserToken } from "../../services/userAuth";
import { promoAdHasContent } from "../../utils/promoAds";

function buildItemLink(productId, searchString) {
  const p = new URLSearchParams(searchString.startsWith("?") ? searchString.slice(1) : searchString);
  p.set("productId", String(productId));
  return { pathname: "/item", search: p.toString() };
}

const AllProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { apiSlug } = useStoreSlug();
  const { settings, features } = useStorefrontSettings();
  const searchString = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const categoryIdFromUrl = searchParams.get("categoryId") || "";
  const qFromUrl = searchParams.get("q") || "";
  const viewFromUrl = searchParams.get("view") || "";
  const isDealsView = viewFromUrl === "deals";
  const isWishlistView = viewFromUrl === "wishlist";

  const { addItem, items: cartItems } = useCart();
  const [products, setProducts] = useState([]);
  const [dealAds, setDealAds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sortOption, setSortOption] = useState("");
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const prefetchedHeroImagesRef = useRef(new Set());

  const wishlistEnabled = !!apiSlug && !!features.wishlistFavorites;
  const { toggle: toggleWishlist, isFavorite } = useWishlist(wishlistEnabled);

  const load = useCallback(async () => {
    setError("");
    if (!apiSlug) {
      setLoading(false);
      setProducts([]);
      setDealAds([]);
      setCategories([]);
      return;
    }
    setLoading(true);
    try {
      if (isDealsView) {
        if (!features.promoAdsSection) {
          setDealAds([]);
          setProducts([]);
          const cats = await fetchStorefrontCategories(apiSlug);
          setCategories(Array.isArray(cats) ? cats : []);
          return;
        }
        const [ads, cats] = await Promise.all([
          fetchStorefrontPromoAds(apiSlug),
          fetchStorefrontCategories(apiSlug),
        ]);
        const withContent = (Array.isArray(ads) ? ads : []).filter(promoAdHasContent);
        setDealAds(withContent);
        setProducts([]);
        setCategories(Array.isArray(cats) ? cats : []);
        return;
      }

      const categoriesPromise = fetchStorefrontCategories(apiSlug);
      const productsPromise = fetchStorefrontProducts(apiSlug, {
        categoryId: categoryIdFromUrl || undefined,
        q: qFromUrl || undefined,
      });

      const cats = await categoriesPromise;
      setCategories(Array.isArray(cats) ? cats : []);

      const list = await productsPromise;
      setDealAds([]);
      setProducts(Array.isArray(list) ? list : []);
      const prices = (Array.isArray(list) ? list : []).map((p) => Number(p.price) || 0);
      const maxP = prices.length ? Math.max(...prices, 1) : 1000;
      setPriceRange((prev) => [0, Math.max(prev[1], Math.ceil(maxP))]);
    } catch (e) {
      setError(e.message || "Could not load products.");
      setProducts([]);
      setDealAds([]);
    } finally {
      setLoading(false);
    }
  }, [apiSlug, categoryIdFromUrl, qFromUrl, isDealsView, features.promoAdsSection]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryIdFromUrl, qFromUrl, apiSlug, viewFromUrl]);

  useEffect(() => {
    const urls = [
      ...(settings?.bannerUrl ? [settings.bannerUrl] : []),
      ...categories.map((c) => c.imageUrl).filter(Boolean),
    ];
    urls.forEach((u) => {
      const absolute = resolveMediaUrl(u);
      if (!absolute || prefetchedHeroImagesRef.current.has(absolute)) return;
      prefetchedHeroImagesRef.current.add(absolute);
      const img = new Image();
      img.decoding = "async";
      img.src = absolute.replace(/-md\.webp($|\?)/i, "-sm.webp$1");
    });
  }, [categories, settings?.bannerUrl]);

  const filtered = useMemo(
    () =>
      products.filter((p) => Number(p.price) >= priceRange[0] && Number(p.price) <= priceRange[1]),
    [products, priceRange]
  );

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (viewFromUrl === "new") {
      arr.sort((a, b) => {
        const da = new Date(a.createdAtUtc || 0).getTime();
        const db = new Date(b.createdAtUtc || 0).getTime();
        return db - da;
      });
      return arr;
    }
    if (sortOption === "price-asc") arr.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortOption === "price-desc") arr.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sortOption === "rating-desc" && features.productRatingStars)
      arr.sort((a, b) => Number(b.ratingAverage || 0) - Number(a.ratingAverage || 0));
    return arr;
  }, [filtered, sortOption, viewFromUrl, features.productRatingStars]);

  const itemsPerPage = 8;
  const sourceList = isDealsView
    ? dealAds
    : isWishlistView
      ? sorted.filter((p) => isFavorite(p.productId))
      : sorted;
  const totalPages = Math.max(1, Math.ceil(sourceList.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSlice = sourceList.slice(startIndex, startIndex + itemsPerPage);

  const cartQtyById = (id) => cartItems.find((x) => x.productId === id)?.quantity || 0;

  const setCategoryFilter = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set("categoryId", id);
    else next.delete("categoryId");
    setSearchParams(next);
  };

  const onToggleHeart = (productId) => {
    if (!getUserToken()) {
      window.dispatchEvent(new CustomEvent("singleVendor:openAuth", { detail: { mode: "login" } }));
      return;
    }
    toggleWishlist(productId);
  };

  const handleAddToCart = (p) => {
    const img = Array.isArray(p.imageUrls) && p.imageUrls[0] ? p.imageUrls[0] : "";
    addItem({
      productId: p.productId,
      name: p.name,
      price: p.price,
      imageUrl: img,
      quantity: 1,
    });
  };

  const showFilters = !isDealsView && !isWishlistView;
  const selectedCategory = categories.find((c) => String(c.categoryId) === String(categoryIdFromUrl));
  const categoryHero = selectedCategory?.imageUrl ? resolveResponsiveMedia(selectedCategory.imageUrl) : null;
  const storeBanner = settings?.bannerUrl ? resolveResponsiveMedia(settings.bannerUrl) : null;
  const useCategoryHero = !!categoryIdFromUrl && !isDealsView && !isWishlistView && viewFromUrl !== "new";
  const productsBanner = useCategoryHero ? (categoryHero || storeBanner) : storeBanner;
  const heroSrc = productsBanner?.src
    ? productsBanner.src.replace(/-md\.webp($|\?)/i, "-sm.webp$1")
    : "";

  return (
    <div className="all-products-page">
      <Header />

      <section className="hero-section-product">
        <div className="hero-content-product">
          <h1>{isDealsView ? "Deals & spotlight" : isWishlistView ? "Your wishlist" : "Discover our collection"}</h1>
          <p>
            {isDealsView
              ? "Promotions your store admin configured for this shop."
              : isWishlistView
                ? "Products you marked as favorite."
                : "Real-time catalog from your store."}
          </p>
          <button
            type="button"
            className="hero-btn"
            onClick={() => document.getElementById("products-grid-anchor")?.scrollIntoView({ behavior: "smooth" })}
          >
            {isDealsView ? "See deals" : isWishlistView ? "See favorites" : "Shop now"}
          </button>
        </div>
        <div className={`hero-image-product ${productsBanner ? "hero-image-product-has-banner" : ""}`}>
          {productsBanner ? (
            <img
              src={heroSrc || productsBanner.src}
              srcSet={productsBanner.srcSet || undefined}
              sizes="(max-width: 768px) 100vw, 360px"
              alt=""
              className="hero-banner-img"
              loading="eager"
              fetchPriority="high"
            />
          ) : null}
        </div>
      </section>

      {error && <p className="catalog-status catalog-status-error">{error}</p>}
      {loading && <p className="catalog-status">Loading…</p>}

      {isDealsView && !loading && !features.promoAdsSection && (
        <p className="catalog-status">Deals are not enabled for this store.</p>
      )}
      {isWishlistView && !loading && !features.wishlistFavorites && (
        <p className="catalog-status">Wishlist is not enabled for this store.</p>
      )}
      {isWishlistView && !loading && features.wishlistFavorites && !getUserToken() && (
        <p className="catalog-status">Sign in to view your wishlist.</p>
      )}

      {showFilters && (
        <div className="top-filters">
          <div className="filters">
            <div className="filter-label">
              <span>Category:</span>
              <select value={categoryIdFromUrl} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c.categoryId} value={String(c.categoryId)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-label">
              <span>Sort by:</span>
              <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                <option value="">Default</option>
                <option value="price-asc">Price low → high</option>
                <option value="price-desc">Price high → low</option>
                {features.productRatingStars && <option value="rating-desc">Rating high → low</option>}
              </select>
            </div>
          </div>
          <div className="filter-label price-filter">
            <span>Price range:</span>
            <input
              type="number"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
              placeholder="Min"
            />
            <input
              type="number"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 0])}
              placeholder="Max"
            />
          </div>
        </div>
      )}

      <section className="products" id="products-grid-anchor">
        {!loading &&
          isDealsView &&
          paginatedSlice.map((ad) => {
            const img = ad.imageUrl ? resolveResponsiveMedia(ad.imageUrl) : null;
            const body = (
              <>
                {img ? (
                  <img
                    src={img.src}
                    srcSet={img.srcSet || undefined}
                    sizes="(max-width: 768px) 100vw, 280px"
                    alt=""
                    className="product-card-image"
                    style={{ marginBottom: 12 }}
                  />
                ) : null}
                <h4>{ad.titleLine}</h4>
                <p className="price" style={{ fontSize: "1.4rem" }}>
                  {ad.bigText}
                </p>
                <p className="product-card-desc">{ad.subLine}</p>
              </>
            );
            const key = ad.slotIndex ?? ad.titleLine;
            if (ad.linkUrl && /^https?:\/\//i.test(String(ad.linkUrl).trim())) {
              const href = String(ad.linkUrl).trim();
              return (
                <a
                  key={key}
                  href={href}
                  className="product-card promo-deal-card-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {body}
                </a>
              );
            }
            return (
              <div key={key} className="product-card">
                {body}
              </div>
            );
          })}

        {!loading &&
          !isDealsView &&
          paginatedSlice.map((product) => {
            const img = product.imageUrls?.[0] ? resolveResponsiveMedia(product.imageUrls[0]) : null;
            const inCart = cartQtyById(product.productId) > 0;
            return (
              <div className="product-card" key={product.productId}>
                <div className="image-placeholder">
                  <Link to={buildItemLink(product.productId, searchString)} className="product-card-image-wrap">
                    {img ? (
                      <img
                        src={img.src}
                        srcSet={img.srcSet || undefined}
                        sizes="(max-width: 768px) 100vw, 260px"
                        alt=""
                        className="product-card-image"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : null}
                  </Link>
                  {features.wishlistFavorites && (
                    <FaHeart
                      className={`fav-icon ${isFavorite(product.productId) ? "favorited" : ""}`}
                      onClick={() => onToggleHeart(product.productId)}
                      role="presentation"
                    />
                  )}
                </div>
                <Link to={buildItemLink(product.productId, searchString)} className="product-info-link">
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <p className="price">${Number(product.price).toFixed(2)}</p>
                    {features.productRatingStars && (
                      <ProductStars value={product.ratingAverage} count={product.ratingCount} />
                    )}
                  </div>
                </Link>
                {features.storefrontCartCheckout &&
                  (!inCart ? (
                    <button type="button" className="add-btn" onClick={() => handleAddToCart(product)}>
                      Add to cart
                    </button>
                  ) : (
                    <p className="in-cart-note">{cartQtyById(product.productId)} in cart</p>
                  ))}
              </div>
            );
          })}
      </section>

      {!loading && sourceList.length === 0 && !isDealsView && (
        <p className="catalog-status">No products match your filters.</p>
      )}
      {!loading && isDealsView && features.promoAdsSection && dealAds.length === 0 && (
        <p className="catalog-status">No active deals yet. Check back soon.</p>
      )}

      <div className="pagination">
        <button
          type="button"
          className="page-btn"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
        >
          Prev
        </button>

        {[...Array(totalPages)].map((_, i) => (
          <button
            type="button"
            key={i}
            className={`page-number ${currentPage === i + 1 ? "active" : ""}`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}

        <button
          type="button"
          className="page-btn"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          Next
        </button>
      </div>

      <Footer />
    </div>
  );
};

export default AllProducts;
