import React, { useCallback, useEffect, useReducer, useState } from "react";
import { FaStar } from "react-icons/fa";
import { getUserToken } from "../../services/userAuth";
import { fetchMyProductReview, submitProductReview } from "../../services/storefrontApi";

/**
 * Clickable 1–5 stars on the product page. Anonymous users see a login / sign-up prompt.
 * Does not change the read-only average row above (parent passes updated averages after submit).
 */
export default function ProductRatingEditor({ productId, storeSlug, onRated }) {
  const [hover, setHover] = useState(0);
  const [value, setValue] = useState(0);
  const [comment, setComment] = useState("");
  const [hint, setHint] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [, bumpSession] = useReducer((n) => n + 1, 0);

  useEffect(() => {
    window.addEventListener("singleVendor:userSession", bumpSession);
    return () => window.removeEventListener("singleVendor:userSession", bumpSession);
  }, []);

  const loggedIn = !!getUserToken();

  const loadMine = useCallback(async () => {
    if (!loggedIn || !productId) return;
    setError("");
    try {
      const data = await fetchMyProductReview(productId, storeSlug);
      const r = data?.rating != null ? Number(data.rating) : 0;
      setValue(Number.isFinite(r) && r >= 1 && r <= 5 ? r : 0);
    } catch {
      setValue(0);
    }
  }, [loggedIn, productId, storeSlug]);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  const openAuth = (mode) => {
    window.dispatchEvent(new CustomEvent("singleVendor:openAuth", { detail: { mode } }));
  };

  const pickStar = (n) => {
    setHint("");
    setError("");
    if (!getUserToken()) {
      setHint("Log in or sign up to rate this product.");
      return;
    }
    setValue(n);
  };

  const submit = async () => {
    setHint("");
    setError("");
    if (!getUserToken()) {
      setHint("Log in or sign up to rate this product.");
      return;
    }
    if (value < 1 || value > 5) {
      setError("Please choose a star rating first.");
      return;
    }
    setBusy(true);
    try {
      const text = comment.trim();
      const res = await submitProductReview(productId, storeSlug, value, text || null);
      onRated?.(res);
      setHint(text ? "Thanks, your review was saved." : "Thanks, your rating was saved.");
      setComment("");
    } catch (e) {
      setError(e.message || "Could not save your rating.");
    } finally {
      setBusy(false);
    }
  };

  const display = hover || value;
  const filled = Math.min(5, Math.max(0, Math.round(display || 0)));

  return (
    <div className="product-rating-editor">
      <p className="product-rating-editor-label">Your rating</p>
      <div
        className="stars product-stars-row product-rating-editor-stars"
        role="group"
        aria-label="Rate this product from 1 to 5 stars"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`star star-btn ${n <= filled ? "filled" : ""}`}
            disabled={busy}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => pickStar(n)}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
          >
            <FaStar />
          </button>
        ))}
      </div>
      <textarea
        className="product-rating-editor-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional: write your review (star rating is required)"
      />
      <div className="product-rating-editor-actions">
        <button type="button" className="product-rating-editor-submit" onClick={submit} disabled={busy}>
          {busy ? "Saving…" : "Save rating/review"}
        </button>
      </div>
      {hint && !loggedIn && (
        <p className="item-rate-hint item-rate-hint--auth">
          {hint}{" "}
          <button type="button" className="item-rate-hint-link" onClick={() => openAuth("login")}>
            Log in
          </button>
          {" · "}
          <button type="button" className="item-rate-hint-link" onClick={() => openAuth("signup")}>
            Sign up
          </button>
        </p>
      )}
      {hint && loggedIn && <p className="item-rate-hint">{hint}</p>}
      {error && <p className="item-rate-hint item-rate-hint--error">{error}</p>}
    </div>
  );
}
