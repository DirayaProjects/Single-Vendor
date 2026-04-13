import React, { useState, useEffect, useCallback } from "react";
import "./landing.css";
import { FaHeart } from "react-icons/fa";
import Header from "../../components/Header/header";
import Testimonials from "../../components/Testimonials/Testimonials";
import Footer from "../../components/Footer/footer";
import { Link, useLocation } from "react-router-dom";
import { useStoreSlug } from "../../hooks/useStoreSlug";
import { fetchStorefrontProducts, fetchStorefrontPromoAds } from "../../services/storefrontApi";
import { useStorefrontSettings } from "../../contexts/StorefrontSettingsContext";
import { resolveMediaUrl, resolveResponsiveMedia } from "../../utils/mediaUrl";
import { useCart } from "../../contexts/CartContext";
import ProductStars from "../../components/ProductStars/ProductStars";
import { useWishlist } from "../../hooks/useWishlist";
import { getUserToken } from "../../services/userAuth";
import { promoAdHasContent, shufflePick } from "../../utils/promoAds";

function buildItemLink(productId, search) {
  const p = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  p.set("productId", String(productId));
  return { pathname: "/item", search: p.toString() };
}

const LandingPage = () => {
  const { search } = useLocation();
  const { apiSlug } = useStoreSlug();
  const { settings, features } = useStorefrontSettings();
  const { addItem, items: cartItems } = useCart();
  const [products, setProducts] = useState([]);
  const [promoAds, setPromoAds] = useState([]);
  const [welcomePromos, setWelcomePromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const storeName = settings?.storeDisplayName || "our shop";
  const bannerSrc = settings?.bannerUrl ? resolveMediaUrl(settings.bannerUrl) : null;
  const bannerResponsive = resolveResponsiveMedia(settings?.bannerUrl || "");

  const wishlistEnabled = !!apiSlug && !!features.wishlistFavorites;
  const { toggle: toggleWishlist, isFavorite } = useWishlist(wishlistEnabled);

  const load = useCallback(async () => {
    setError("");
    if (!apiSlug) {
      setLoading(false);
      setProducts([]);
      setPromoAds([]);
      return;
    }
    setLoading(true);
    try {
      const [list, ads] = await Promise.all([
        fetchStorefrontProducts(apiSlug),
        features.promoAdsSection
          ? fetchStorefrontPromoAds(apiSlug).catch(() => [])
          : Promise.resolve([]),
      ]);
      const arr = Array.isArray(list) ? list : [];
      setProducts(arr.slice(0, 6));
      setPromoAds(Array.isArray(ads) ? ads : []);
    } catch (e) {
      setError(e.message || "Could not load products.");
      setProducts([]);
      setPromoAds([]);
    } finally {
      setLoading(false);
    }
  }, [apiSlug, features.promoAdsSection]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!features.promoAdsSection || !promoAds.length) {
      setWelcomePromos([]);
      return;
    }
    const withContent = promoAds.filter(promoAdHasContent);
    setWelcomePromos(shufflePick(withContent, 3));
  }, [promoAds, features.promoAdsSection]);

  const cartQtyById = (id) => cartItems.find((x) => x.productId === id)?.quantity || 0;

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

  const featured = products.slice(0, 3);

  const showPromoRow = features.promoAdsSection && welcomePromos.length > 0;

  return (
    <div className="landing">
      <Header />

      <section className="hero">
        <div className="hero-text">
          <h2>
            Welcome to <span>{storeName}</span>!
          </h2>
          <p>Enjoy shopping</p>
        </div>
        <div className={`hero-image ${bannerSrc ? "hero-image-has-banner" : ""}`}>
          {bannerSrc ? (
            <img
              src={bannerResponsive.src || bannerSrc}
              srcSet={bannerResponsive.srcSet || undefined}
              sizes="(max-width: 768px) 100vw, 50vw"
              alt=""
              className="hero-banner-img"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : null}
        </div>
      </section>

      {showPromoRow && (
        <section className="promos">
          {welcomePromos.map((ad) => {
            const img = ad.imageUrl ? resolveResponsiveMedia(ad.imageUrl) : null;
            const body = (
              <>
                {img ? <img src={img.src} srcSet={img.srcSet || undefined} sizes="(max-width: 768px) 100vw, 33vw" alt="" className="promo-card-image" /> : null}
                <h3>{ad.titleLine}</h3>
                <h1>{ad.bigText}</h1>
                <p>{ad.subLine}</p>
              </>
            );
            const key = ad.slotIndex ?? ad.titleLine;
            if (ad.linkUrl && /^https?:\/\//i.test(String(ad.linkUrl).trim())) {
              const href = String(ad.linkUrl).trim();
              return (
                <a
                  key={key}
                  href={href}
                  className="promo-card promo-card-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {body}
                </a>
              );
            }
            return (
              <div key={key} className="promo-card">
                {body}
              </div>
            );
          })}
        </section>
      )}

      {error && <p className="landing-status landing-status-error">{error}</p>}
      {loading && <p className="landing-status">Loading products…</p>}

      <section className="products">
        {!loading &&
          products.map((product) => {
            const img = product.imageUrls?.[0] ? resolveResponsiveMedia(product.imageUrls[0]) : null;
            const inCart = cartQtyById(product.productId) > 0;
            return (
              <div className="product-card" key={product.productId}>
                <div className="image-placeholder">
                  <Link to={buildItemLink(product.productId, search)} className="product-card-image-wrap">
                    {img ? (
                      <img
                        src={img.src}
                        srcSet={img.srcSet || undefined}
                        sizes="(max-width: 768px) 100vw, 320px"
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
                <Link to={buildItemLink(product.productId, search)} className="product-info-link">
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <p className="product-card-desc">
                      {product.description
                        ? `${String(product.description).slice(0, 80)}${String(product.description).length > 80 ? "…" : ""}`
                        : product.brand || "\u00a0"}
                    </p>
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

      <div className="view-all-container">
        <Link to={{ pathname: "/products", search }} className="view-all-btn">
          View all products
        </Link>
      </div>

      <section className="featured">
        <h3>Featured</h3>
        <div className="featured-grid">
          {featured.map((p) => {
            const img = p.imageUrls?.[0] ? resolveResponsiveMedia(p.imageUrls[0]) : null;
            return (
              <Link
                key={p.productId}
                to={buildItemLink(p.productId, search)}
                className="featured-card featured-card-link"
              >
                {img ? <img src={img.src} srcSet={img.srcSet || undefined} sizes="(max-width: 768px) 50vw, 240px" alt="" className="featured-card-img" /> : null}
              </Link>
            );
          })}
          {featured.length === 0 && !loading && <p className="featured-empty">No products yet.</p>}
        </div>
      </section>

      <Testimonials />
      <Footer />
    </div>
  );
};

export default LandingPage;
