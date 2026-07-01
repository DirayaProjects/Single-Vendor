import React, { useEffect, useMemo, useState } from "react";
import "./SpinWheelModal.css";
import { getSpinWheelStatus, spinWheel } from "../../services/spinWheelApi";

const DEFAULT_COLORS = ["#0f223d", "#c9a227", "#e74c3c", "#27ae60", "#8e44ad", "#2980b9", "#d35400", "#16a085"];

function buildWheelGradient(prizes) {
  if (!prizes.length) return "#eee";
  const slice = 360 / prizes.length;
  const stops = prizes.map((prize, index) => {
    const color = prize.color?.trim() || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
    const start = index * slice;
    const end = (index + 1) * slice;
    return `${color} ${start}deg ${end}deg`;
  });
  return `conic-gradient(from -90deg, ${stops.join(", ")})`;
}

function FortuneWheel({ prizes, rotation }) {
  const slice = prizes.length ? 360 / prizes.length : 0;
  const gradient = useMemo(() => buildWheelGradient(prizes), [prizes]);

  return (
    <div className="fortune-wheel-outer">
      <div className="fortune-wheel-rim" />
      <div className="fortune-wheel" style={{ transform: `rotate(${rotation}deg)`, background: gradient }}>
        <div className="fortune-wheel-labels">
          {prizes.map((prize, index) => {
            const angle = (index + 0.5) * slice - 90;
            const rad = (angle * Math.PI) / 180;
            const x = 50 + 34 * Math.cos(rad);
            const y = 50 + 34 * Math.sin(rad);
            return (
              <span
                key={prize.id}
                className="fortune-label"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`,
                }}
              >
                {prize.label}
              </span>
            );
          })}
        </div>
      </div>
      <div className="fortune-wheel-cap" />
    </div>
  );
}

export default function SpinWheelModal({ slug, userId, onClose }) {
  const [status, setStatus] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug || !userId) return;
    getSpinWheelStatus(slug, userId)
      .then(setStatus)
      .catch((err) => setError(err.message));
  }, [slug, userId]);

  const animateToPrize = (prizeId, prizeCount) => {
    const prizeIndex = status.prizes.findIndex((p) => p.id === prizeId);
    if (prizeIndex < 0 || !prizeCount) return;
    const slice = 360 / prizeCount;
    const offset = 360 - (prizeIndex + 0.5) * slice;
    setRotation((prev) => prev + 360 * 6 + offset);
  };

  const handleSpin = async () => {
    if (!status?.prizes?.length || spinning) return;

    try {
      setSpinning(true);
      setError("");
      setResult(null);

      const data = await spinWheel(slug, userId);
      animateToPrize(data.prize.id, status.prizes.length);

      setTimeout(async () => {
        setResult(data);
        const refreshed = await getSpinWheelStatus(slug, userId);
        setStatus(refreshed);
        setSpinning(false);
      }, 4200);
    } catch (err) {
      setError(err.message || "Spin failed");
      setSpinning(false);
    }
  };

  if (!status) {
    return (
      <div className="spin-overlay">
        <div className="spin-modal">
          <p>{error || "Loading..."}</p>
          <button type="button" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  const prizes = status.prizes || [];

  return (
    <div className="spin-overlay">
      <div className="spin-modal spin-modal-wide">
        <button type="button" className="spin-close" onClick={onClose}>×</button>
        <h2>Spin &amp; Win!</h2>
        <p className="spin-sub">Press SPIN and watch the wheel — your discount is applied at checkout.</p>

        <div className="fortune-stage">
          <div className="fortune-pointer" aria-hidden="true" />
          {prizes.length > 0 ? (
            <FortuneWheel prizes={prizes} rotation={rotation} />
          ) : (
            <div className="fortune-wheel-empty">Add wheel prizes in admin settings first.</div>
          )}
        </div>

        {result && (
          <p className="spin-result">
            You won: <strong>{result.prize.label}</strong>
            {result.prize.discountPercent ? ` (${result.prize.discountPercent}% off your order)` : ""}
            {result.prize.discountAmount ? ` ($${Number(result.prize.discountAmount).toFixed(2)} off your order)` : ""}
          </p>
        )}

        {status.hasUnusedPrize && status.unusedPrize && !result && (
          <p className="spin-result">
            Your prize: <strong>{status.unusedPrize.label}</strong> — will be applied when you place an order.
          </p>
        )}

        {error && <p className="spin-error">{error}</p>}

        {status.canSpin && prizes.length > 0 ? (
          <button type="button" className="spin-btn spin-btn-large" onClick={handleSpin} disabled={spinning}>
            {spinning ? "Spinning..." : "SPIN"}
          </button>
        ) : (
          <button type="button" className="spin-btn secondary" onClick={onClose}>Continue Shopping</button>
        )}
      </div>
    </div>
  );
}
