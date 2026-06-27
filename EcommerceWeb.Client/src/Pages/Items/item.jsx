import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./item.css";
import { FaStar } from "react-icons/fa";
import Header from "../../components/Header/header.jsx";
import Footer from "../../components/Footer/footer.jsx";
import AuthModal from "../../components/AuthModal/AuthModal";
import { fetchStorefrontProduct, fetchProductReviews, submitProductReview } from "../../services/storefrontApi";
import { useStoreSlug } from "../../hooks/useStoreSlug";
import { useCart, useCustomerAuth } from "../../contexts/CartContext";
import { getAuthSession } from "../../services/authApi";
import { sizedImageUrl } from "../../services/uploadApi";

const Item = () => {
  const { id } = useParams();
  const { slug } = useStoreSlug();
  const { addItem, itemCount, refreshCart } = useCart();
  const { isCustomer } = useCustomerAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadProduct = async () => {
    const data = await fetchStorefrontProduct(slug, id);
    setProduct(data);
    const first = sizedImageUrl(data.images?.[0], "medium") || data.images?.[0] || null;
    setMainImage(first);
  };

  const loadReviews = async () => {
    const data = await fetchProductReviews(slug, id);
    setReviews(data);
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        await loadProduct();
        await loadReviews();
      } catch (err) {
        if (mounted) {
          setError(err.message || "Product not found");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [slug, id]);

  const handleAddToCart = async () => {
    try {
      const result = await addItem(Number(id), quantity);
      if (result?.needsLogin) {
        setShowAuth(true);
      }
    } catch (err) {
      alert(err.message || "Failed to add to cart");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const session = getAuthSession();
    if (!session?.userId || session.isAdmin) {
      setShowAuth(true);
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewMessage("");
      await submitProductReview(slug, id, {
        userId: session.userId,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewComment("");
      await loadProduct();
      await loadReviews();
      setReviewMessage("Review submitted successfully.");
    } catch (err) {
      setReviewMessage(err.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const promptLoginForReview = () => {
    setShowAuth(true);
  };

  if (loading) {
    return <div className="product-page"><p className="loading-text">Loading product...</p></div>;
  }

  if (error || !product) {
    return <div className="product-page"><p className="error-text">{error || "Product not found"}</p></div>;
  }

  const images = (product.images || []).map((url) => sizedImageUrl(url, "medium") || url);
  const attributeEntries = Object.entries(product.attributes || {});

  return (
    <div className="product-page">
      <Header cartCount={itemCount} onRequireLogin={() => setShowAuth(true)} />

      <div className="product-wrapper">
        <div className="product-container">
          <div className="product-image-section">
            {mainImage ? (
              <img src={mainImage} alt={product.name} className="main-image main-image-real" />
            ) : (
              <div className="main-image" />
            )}

            <div className="thumbnail-row">
              {images.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  className="thumb thumb-btn"
                  onClick={() => setMainImage(img)}
                  style={{ backgroundImage: `url(${img})`, backgroundSize: "cover" }}
                />
              ))}
            </div>
          </div>

          <div className="product-details">
            <h2>{product.name}</h2>
            <p className="price">${Number(product.price).toFixed(2)}</p>
            <p className="details">{product.details || "—"}</p>
            <div className="stars-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className={star <= Math.round(product.rating) ? "star-filled" : "star-empty"}
                />
              ))}
              <span>({Number(product.rating).toFixed(1)})</span>
            </div>

            {product.brand && <p><strong>Brand:</strong> {product.brand}</p>}
            {product.category && <p><strong>Category:</strong> {product.category}</p>}

            {attributeEntries.length > 0 && (
              <div className="product-attr-list">
                {attributeEntries.map(([name, values]) => (
                  <p key={name}>
                    <strong>{name}:</strong> {(Array.isArray(values) ? values : [values]).join(", ")}
                  </p>
                ))}
              </div>
            )}

            <div className="quantity-control">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}>+</button>
            </div>

            <div className="buttons">
              <button type="button" className="add-cart" onClick={handleAddToCart}>Add to Cart</button>
            </div>
          </div>
        </div>

        <section className="product-reviews-section">
          <h3>Customer Reviews</h3>

          {reviews.length === 0 ? (
            <p className="empty-reviews">No reviews yet.</p>
          ) : (
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review.id} className="review-item">
                  <strong>{review.username}</strong>
                  <div className="stars-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        className={star <= Math.round(review.rating) ? "star-filled" : "star-empty"}
                      />
                    ))}
                  </div>
                  <p>{review.comment}</p>
                </div>
              ))}
            </div>
          )}

          {isCustomer ? (
            <form className="review-form" onSubmit={handleSubmitReview}>
              <h4>Write a review</h4>
              <label>
                Rating
                <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>{r} stars</option>
                  ))}
                </select>
              </label>
              <label>
                Comment
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  required
                  placeholder="Share your experience..."
                />
              </label>
              {reviewMessage && <p className="review-message">{reviewMessage}</p>}
              <button type="submit" className="add-cart" disabled={submittingReview}>
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          ) : (
            <div className="review-login-prompt">
              <p>Log in to rate and review this product.</p>
              <button type="button" className="add-cart" onClick={promptLoginForReview}>Log In to Review</button>
            </div>
          )}
        </section>
      </div>

      <Footer />

      {showAuth && (
        <AuthModal
          mode="login"
          onClose={() => setShowAuth(false)}
          onSuccess={() => {
            setShowAuth(false);
            refreshCart();
          }}
        />
      )}
    </div>
  );
};

export default Item;
