import React, { useState, useEffect, useCallback } from "react";
import "./Testimonials.css";
import { FaStar } from "react-icons/fa";
import { useStoreSlug } from "../../hooks/useStoreSlug";
import { useStorefrontSettings } from "../../contexts/StorefrontSettingsContext";
import { fetchStorefrontReviews } from "../../services/storefrontApi";

function mapApiReview(r, idx) {
  const id = r.productReviewId ?? idx;
  return {
    id,
    username: r.username || "Customer",
    rating: Number(r.rating) || 0,
    comment: r.comment || "",
    img: `https://i.pravatar.cc/60?u=${encodeURIComponent(String(id))}`,
    location: r.productName || "",
  };
}

const Reviews = () => {
  const { apiSlug } = useStoreSlug();
  const { features } = useStorefrontSettings();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!apiSlug) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await fetchStorefrontReviews(apiSlug, 40);
      if (Array.isArray(list) && list.length > 0) {
        setRows(list.map(mapApiReview));
      } else {
        setRows([]);
      }
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [apiSlug]);

  useEffect(() => {
    load();
  }, [load]);

  if (!features.storefrontTestimonials) return null;
  if (!apiSlug || loading || rows.length === 0) return null;

  const doubledTestimonials = [...rows, ...rows];

  return (
    <section className="reviews-section">
      <div className="reviews-container">
        <h1>Don’t Trust Us, Trust Our Customers</h1>
        <p className="reviews-source-line">
          Pulled from real product reviews in this store (what shoppers wrote on product pages).
        </p>

        <div className="carousel">
          <div className="carousel-track">
            {doubledTestimonials.map((review, index) => (
              <div className="review-card" key={`${review.id}-${index}`}>
                <div className="review-top">
                  <div className="user-info">
                    <img className="profile" src={review.img} alt={review.username} />
                    <p>{review.username}</p>
                  </div>
                  <div className="review-rating">
                    <div className="rating-wrapper">
                      <p className="avg-rating">{review.rating}</p>
                      <FaStar className="starTest" />
                    </div>
                    <p className="review-flight">{review.location || "\u00a0"}</p>
                  </div>
                </div>
                <p className="review-text">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Reviews;
