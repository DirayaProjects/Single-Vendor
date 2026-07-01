import React, { useState } from "react";
import "./AddToCartModal.css";
import PriceDisplay from "../PriceDisplay/PriceDisplay";
import ProductAttributeSelector from "../ProductAttributeSelector/ProductAttributeSelector";
import { useCart } from "../../contexts/CartContext";
import { areAllAttributesSelected, productHasAttributes } from "../../utils/productAttributes";
import { savePendingCartAdd } from "../../utils/pendingCartStorage";
import { sizedImageUrl } from "../../services/uploadApi";

export default function AddToCartModal({ product, onClose, onAdded, onNeedsLogin, initialQuantity = 1, initialAttributes = {} }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(initialQuantity);
  const [selectedAttributes, setSelectedAttributes] = useState(initialAttributes);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!product) return null;

  const image = sizedImageUrl(product.images?.[0], "medium") || product.images?.[0];
  const hasAttributes = productHasAttributes(product.attributes);
  const canAdd = !hasAttributes || areAllAttributesSelected(product.attributes, selectedAttributes);
  const maxQty = Math.max(1, Number(product.quantity) || 1);

  const handleAdd = async () => {
    if (!canAdd) {
      setError("Please choose all options before adding to cart.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const result = await addItem(product.id, quantity, selectedAttributes);
      if (result?.needsLogin) {
        savePendingCartAdd({
          productId: product.id,
          quantity,
          selectedAttributes,
          product,
        });
        onNeedsLogin?.();
        return;
      }
      onAdded?.(product.id);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add to cart");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-cart-overlay" onClick={onClose}>
      <div className="add-cart-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="add-cart-close" onClick={onClose}>×</button>

        <div className="add-cart-header">
          {image ? <img src={image} alt={product.name} className="add-cart-thumb" /> : <div className="add-cart-thumb placeholder" />}
          <div>
            <h3>{product.name}</h3>
            <p className="add-cart-price">
              <PriceDisplay
                price={product.price}
                salePrice={product.salePrice}
                effectivePrice={product.effectivePrice}
              />
            </p>
          </div>
        </div>

        {hasAttributes && (
          <ProductAttributeSelector
            attributes={product.attributes}
            selected={selectedAttributes}
            onChange={setSelectedAttributes}
          />
        )}

        <div className="add-cart-quantity">
          <span>Quantity</span>
          <div className="quantity-control">
            <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
            <span>{quantity}</span>
            <button type="button" onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}>+</button>
          </div>
        </div>

        {error && <p className="add-cart-error">{error}</p>}

        <button
          type="button"
          className="add-cart-submit"
          onClick={handleAdd}
          disabled={loading || !canAdd}
        >
          {loading ? "Adding..." : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
