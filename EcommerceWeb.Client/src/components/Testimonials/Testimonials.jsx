import React, { useCallback, useEffect, useState } from "react";
import "./Testimonials.css";
import { FaChevronLeft, FaChevronRight, FaStar } from "react-icons/fa";
import { useStorefront } from "../../contexts/StorefrontContext";
import { sizedImageUrl } from "../../services/uploadApi";

const AUTO_PLAY_MS = 5000;

const Reviews = () => {
  const { testimonials } = useStorefront();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const total = testimonials.length;
  const hasMultiple = total > 1;

  const goTo = useCallback(
    (index) => {
      if (!total) return;
      setActiveIndex(((index % total) + total) % total);
    },
    [total]
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    setActiveIndex(0);
  }, [total]);

  useEffect(() => {
    if (!hasMultiple || paused) return undefined;

    const timer = window.setInterval(goNext, AUTO_PLAY_MS);
    return () => window.clearInterval(timer);
  }, [hasMultiple, paused, goNext]);

  if (!total) {
    return null;
  }

  return (
    <section
      className="reviews-section"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="reviews-container">
        <h1>Don&apos;t Trust Us, Trust Our Customers</h1>

        <div className="carousel">
          {hasMultiple && (
            <button
              type="button"
              className="carousel-btn carousel-btn-prev"
              onClick={goPrev}
              aria-label="Previous review"
            >
              <FaChevronLeft />
            </button>
          )}

          <div className="carousel-viewport">
            <div
              className="carousel-track"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {testimonials.map((item) => {
                const itemImage = sizedImageUrl(item.image, "thumb") || item.image;
                return (
                  <div className="review-card" key={item.id}>
                    <div className="review-top">
                      <div className="user-info">
                        {itemImage ? (
                          <img className="profile" src={itemImage} alt={item.username} />
                        ) : (
                          <div className="profile profile-placeholder">
                            {item.username.charAt(0)}
                          </div>
                        )}
                        <p>{item.username}</p>
                      </div>
                      <div className="review-rating">
                        <div className="rating-wrapper">
                          <p className="avg-rating">{Number(item.rating).toFixed(1)}</p>
                          <FaStar className="starTest" />
                        </div>
                      </div>
                    </div>
                    <p className="review-text">{item.comment}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {hasMultiple && (
            <button
              type="button"
              className="carousel-btn carousel-btn-next"
              onClick={goNext}
              aria-label="Next review"
            >
              <FaChevronRight />
            </button>
          )}
        </div>

        {hasMultiple && (
          <div className="carousel-dots">
            {testimonials.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`carousel-dot ${index === activeIndex ? "active" : ""}`}
                onClick={() => goTo(index)}
                aria-label={`Go to review ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Reviews;
