import React, { useState, useEffect, useCallback, useMemo } from "react";
import "./item.css";
import Header from "../../components/Header/header.jsx";
import Footer from "../../components/Footer/footer.jsx";
import { useSearchParams, Link, useNavigate, Navigate } from "react-router-dom";
import { useStoreSlug } from "../../hooks/useStoreSlug";
import { fetchStorefrontProductDetail, fetchStorefrontProductReviews } from "../../services/storefrontApi";
import { resolveResponsiveMedia } from "../../utils/mediaUrl";
import { useCart } from "../../contexts/CartContext";
import { useStorefrontSettings } from "../../contexts/StorefrontSettingsContext";
import ProductStars from "../../components/ProductStars/ProductStars";
import ProductRatingEditor from "../../components/ProductRatingEditor/ProductRatingEditor";

const Item = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { apiSlug } = useStoreSlug();
  const productId = Number(searchParams.get("productId"));
  const { addItem } = useCart();
  const { features } = useStorefrontSettings();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState("");
  const [publicReviews, setPublicReviews] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [attributeError, setAttributeError] = useState("");

  const isColorValue = useCallback((value) => {
    const v = String(value || "").trim();
    if (!v) return false;
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return true;
    if (/^rgba?\(/i.test(v) || /^hsla?\(/i.test(v)) return true;
    const commonColorNames = new Set([
      "black",
      "white",
      "red",
      "green",
      "blue",
      "yellow",
      "orange",
      "purple",
      "pink",
      "gray",
      "grey",
      "brown",
      "beige",
      "gold",
      "silver",
      "navy",
      "teal",
      "maroon",
      "olive",
      "cyan",
      "magenta",
    ]);
    return commonColorNames.has(v.toLowerCase());
  }, []);

  const splitAttributeValues = useCallback((rawValue) => {
    const value = String(rawValue || "").trim();
    if (!value) return [];
    return Array.from(
      new Set(
        value
          .split(/\s*(?:\||\/|,|;)\s*/)
          .map((x) => x.trim())
          .filter(Boolean)
      )
    );
  }, []);

  const attributeSelectors = useMemo(() => {
    if (!product?.specifications || typeof product.specifications !== "object") return [];
    return Object.entries(product.specifications)
      .map(([name, raw]) => {
        const options = splitAttributeValues(raw);
        return {
          name,
          options,
          required: options.length > 1,
          isColor:
            /colou?r/i.test(name) && options.length > 0 && options.every((value) => isColorValue(value)),
        };
      })
      .filter((a) => a.options.length > 0);
  }, [product, splitAttributeValues, isColorValue]);

  const load = useCallback(async () => {
    if (!Number.isFinite(productId) || productId < 1) {
      setError("Missing or invalid product.");
      setProduct(null);
      setLoading(false);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await fetchStorefrontProductDetail(productId, apiSlug);
      setProduct(data);
      const first = Array.isArray(data.imageUrls) && data.imageUrls[0] ? data.imageUrls[0] : "";
      setMainImage(first);
    } catch (e) {
      setError(e.message || "Product not found.");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [productId, apiSlug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!product || (!features.productRatingStars && !features.customerProductReviews)) {
      setPublicReviews([]);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchStorefrontProductReviews(product.productId, apiSlug);
        if (!cancelled) setPublicReviews(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setPublicReviews([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [product, apiSlug, features.productRatingStars, features.customerProductReviews]);

  useEffect(() => {
    const defaults = {};
    attributeSelectors.forEach((attr) => {
      if (attr.options.length === 1) defaults[attr.name] = attr.options[0];
    });
    setSelectedAttributes(defaults);
    setAttributeError("");
  }, [attributeSelectors]);

  const ensureRequiredAttributesSelected = () => {
    const missing = attributeSelectors.filter((attr) => attr.required && !selectedAttributes[attr.name]);
    if (missing.length === 0) return true;
    setAttributeError(`Please choose ${missing.map((x) => x.name).join(", ")} before adding to cart.`);
    return false;
  };

  const handleAddCart = () => {
    if (!product) return;
    if (!ensureRequiredAttributesSelected()) return;
    const img = mainImage || product.imageUrls?.[0] || "";
    addItem({
      productId: product.productId,
      name: product.name,
      price: product.price,
      imageUrl: img,
      quantity,
      selectedAttributes,
    });
    setAttributeError("");
  };

  const handleBuyNow = () => {
    handleAddCart();
    navigate({ pathname: "/cart", search: searchParams.toString() });
  };

  const thumbs = product?.imageUrls?.length ? product.imageUrls : [];

  if (!apiSlug) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="product-page">
      <Header />

      <div className="product-wrapper">
        {loading && <p className="item-status">Loading…</p>}
        {error && (
          <p className="item-status item-status-error">
            {error}{" "}
            <Link to={{ pathname: "/products", search: searchParams.toString() }}>Back to products</Link>
          </p>
        )}

        {!loading && product && (
          <div className="product-container">
            <div className="product-image-section">
              <div className="main-image">
                {mainImage ? (
                  (() => {
                    const img = resolveResponsiveMedia(mainImage);
                    return <img src={img.src} srcSet={img.srcSet || undefined} sizes="(max-width: 768px) 100vw, 560px" alt="" className="main-image-img" />;
                  })()
                ) : null}
              </div>

              {thumbs.length > 0 && (
                <div className="thumbnail-row">
                  {thumbs.slice(0, 6).map((u) => (
                    <button
                      type="button"
                      key={u}
                      className={`thumb thumb-btn ${u === mainImage ? "thumb-active" : ""}`}
                      onClick={() => setMainImage(u)}
                      aria-label="Show image"
                    >
                      {(() => {
                        const img = resolveResponsiveMedia(u);
                        return <img src={img.src} srcSet={img.srcSet || undefined} sizes="110px" alt="" className="thumb-img" />;
                      })()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="product-details">
              <h2>{product.name}</h2>
              <p className="price">${Number(product.price).toFixed(2)}</p>
              {features.productRatingStars && (
                <ProductStars value={product.ratingAverage} count={product.ratingCount} />
              )}
              <div className="product-meta-row">
                {product.categoryName && <span className="product-meta-chip">Category: {product.categoryName}</span>}
                {product.brand && <span className="product-meta-chip">Brand: {product.brand}</span>}
              </div>
              {product.description && <p className="details">{product.description}</p>}

              {attributeSelectors.length > 0 && (
                <div className="product-attribute-selectors">
                  <p className="product-attribute-title">Select options</p>
                  {attributeSelectors.map((attr) => (
                    <div key={attr.name} className="product-attribute-row">
                      <span className="product-attribute-name">
                        {attr.name}
                        {attr.required ? " *" : ""}
                      </span>
                      <div className="product-attribute-values">
                        {attr.options.map((option) => {
                          const selected = selectedAttributes[attr.name] === option;
                          if (attr.isColor) {
                            return (
                              <button
                                type="button"
                                key={`${attr.name}-${option}`}
                                className={`color-circle-btn ${selected ? "selected" : ""}`}
                                style={{ backgroundColor: option }}
                                onClick={() => {
                                  setSelectedAttributes((prev) => ({ ...prev, [attr.name]: option }));
                                  setAttributeError("");
                                }}
                                aria-label={`${attr.name}: ${option}`}
                                title={option}
                              />
                            );
                          }
                          return (
                            <button
                              type="button"
                              key={`${attr.name}-${option}`}
                              className={`attr-value-chip ${selected ? "selected" : ""}`}
                              onClick={() => {
                                setSelectedAttributes((prev) => ({ ...prev, [attr.name]: option }));
                                setAttributeError("");
                              }}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {attributeError ? <p className="item-status item-status-error">{attributeError}</p> : null}
                </div>
              )}

              <p className="stock-line">In stock: {product.stockQuantity}</p>

              <div className="quantity-control">
                <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                  -
                </button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setQuantity((q) => q + 1)}>
                  +
                </button>
              </div>

              {features.storefrontCartCheckout && (
                <div className="buttons">
                  <button type="button" className="buy-now" onClick={handleBuyNow}>
                    Buy now
                  </button>
                  <button type="button" className="add-cart" onClick={handleAddCart}>
                    Add to cart
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {!loading && product && features.customerProductReviews && (
        <section className="product-page-reviews" aria-label="Customer reviews">
          <h3 className="product-page-reviews-title">Ratings & reviews</h3>
          {publicReviews.length > 0 ? (
            <ul className="product-page-reviews-list">
              {publicReviews.map((r) => (
                <li key={r.productReviewId} className="product-page-review-item">
                  <div className="product-page-review-meta">
                    <span className="product-page-review-user">{r.username || "Customer"}</span>
                    <span className="product-page-review-stars">{Number(r.rating).toFixed(1)} ★</span>
                  </div>
                  {r.comment ? <p className="product-page-review-text">{r.comment}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="item-status">No reviews yet. Be the first to rate this product.</p>
          )}
          <div className="product-page-review-editor">
            <ProductRatingEditor
              productId={product.productId}
              storeSlug={apiSlug}
              onRated={(res) => {
                if (!res) return;
                setProduct((prev) =>
                  prev
                    ? {
                        ...prev,
                        ratingAverage: res.ratingAverage ?? prev.ratingAverage,
                        ratingCount: res.ratingCount ?? prev.ratingCount,
                      }
                    : prev
                );
              }}
            />
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Item;
