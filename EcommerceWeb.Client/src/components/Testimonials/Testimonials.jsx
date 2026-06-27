import React from "react";
import "./Testimonials.css";
import { FaStar } from "react-icons/fa";
import { useStorefront } from "../../contexts/StorefrontContext";
import { sizedImageUrl } from "../../services/uploadApi";

const Reviews = () => {
  const { testimonials } = useStorefront();

  if (!testimonials.length) {
    return null;
  }

  const doubledTestimonials = [...testimonials, ...testimonials];

  return (
    <section className="reviews-section">
      <div className="reviews-container">
        <h1>Don&apos;t Trust Us, Trust Our Customers</h1>

        <div className="carousel">
          <div className="carousel-track">
            {doubledTestimonials.map((review, index) => {
              const image = sizedImageUrl(review.image, "thumb") || review.image;
              return (
                <div className="review-card" key={`${review.id}-${index}`}>
                  <div className="review-top">
                    <div className="user-info">
                      {image ? (
                        <img className="profile" src={image} alt={review.username} />
                      ) : (
                        <div className="profile profile-placeholder">{review.username.charAt(0)}</div>
                      )}
                      <p>{review.username}</p>
                    </div>
                    <div className="review-rating">
                      <div className="rating-wrapper">
                        <p className="avg-rating">{Number(review.rating).toFixed(1)}</p>
                        <FaStar className="starTest" />
                      </div>
                    </div>
                  </div>
                  <p className="review-text">{review.comment}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Reviews;
