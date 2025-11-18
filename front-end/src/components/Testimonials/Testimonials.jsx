import React from "react";
import "./Testimonials.css";
import { FaStar } from "react-icons/fa";

const testimonials = [
  {
    id: 1,
    username: "John Doe",
    rating: 4.5,
    comment:
      "Smooth booking process, efficient check-in, and pleasant experience.",
    img: "https://i.pravatar.cc/60?img=1",
   
  },
  {
    id: 2,
    username: "Sarah Lee",
    rating: 4.8,
    comment: "Excellent customer support and seamless overall experience.",
    img: "https://i.pravatar.cc/60?img=2",
  
  },
  {
    id: 3,
    username: "David Kim",
    rating: 4.3,
    comment: "Comfortable seats and friendly staff. Loved it!",
    img: "https://i.pravatar.cc/60?img=3",
  
  },
  {
    id: 4,
    username: "Emily Clark",
    rating: 4.7,
    comment: "Quick booking and amazing experience overall.",
    img: "https://i.pravatar.cc/60?img=4",
    
  },
  {
    id: 5,
    username: "Maria Rossi",
    rating: 4.9,
    comment: "Absolutely loved the smooth interface and easy process!",
    img: "https://i.pravatar.cc/60?img=5",
   
  },
];

const Reviews = () => {
  const doubledTestimonials = [...testimonials, ...testimonials]; 

  return (
    <section className="reviews-section">
      <div className="reviews-container">
        <h1>Don’t Trust Us, Trust Our Customers</h1>

        <div className="carousel">
          <div className="carousel-track">
            {doubledTestimonials.map((review, index) => (
              <div className="review-card" key={index}>
                <div className="review-top">
                  <div className="user-info">
                    <img
                      className="profile"
                      src={review.img}
                      alt={review.username}
                    />
                    <p>{review.username}</p>
                  </div>
                  <div className="review-rating">
                    <div className="rating-wrapper">
                      <p className="avg-rating">{review.rating}</p>
                      <FaStar className="starTest" />
                    </div>
                    <p className="review-flight">{review.location}</p>
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
