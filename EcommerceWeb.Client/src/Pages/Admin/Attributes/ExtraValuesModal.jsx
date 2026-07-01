import React from "react";
import { FaTimes } from "react-icons/fa";
import { isColorAttributeName } from "../../../utils/colorAttribute";
import ColorSwatch from "../../../components/ColorSwatch/ColorSwatch";

const ExtraValuesModal = ({ values, attributeName, closeModal }) => {
  const isColor = isColorAttributeName(attributeName);

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal-content modal-extra" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="extra-close-btn" onClick={closeModal}><FaTimes /></button>
        <h3>More Values</h3>
        <div className={`values-list extra-values-list ${isColor ? "color-values-list" : ""}`}>
          {values.map((v, i) =>
            isColor ? (
              <ColorSwatch key={i} color={v} size="md" title={v} />
            ) : (
              <span key={i} className="value-pill">{v}</span>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ExtraValuesModal;
