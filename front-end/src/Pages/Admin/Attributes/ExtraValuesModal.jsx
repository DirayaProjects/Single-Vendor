import React from "react";
import { FaTimes } from "react-icons/fa";

const ExtraValuesModal = ({ values, closeModal }) => {
  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal-content modal-extra" onClick={e => e.stopPropagation()}>
        <button className="extra-close-btn" onClick={closeModal}><FaTimes /></button>
        <h3>More Values</h3>
        <div className="values-list extra-values-list">
          {values.map((v, i) => <span key={i} className="value-pill">{v}</span>)}
        </div>
      </div>
    </div>
  );
};

export default ExtraValuesModal;
