import React, { useEffect, useState } from "react";
import Sidebar from "../../../components/AdminSidebar/sidebar";
import AttributeModal from "./AttributesModal";
import ExtraValuesModal from "./ExtraValuesModal";
import "./AttributesPage.css";
import { FaEdit, FaTrash, FaLayerGroup, FaStar, FaClock } from "react-icons/fa";
import dayjs from "dayjs";
import {
  getAttributes,
  createAttribute,
  updateAttribute,
  deleteAttribute,
} from "../../../services/attributesApi";

const AttributesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [attributes, setAttributes] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [formData, setFormData] = useState({ name: "", values: [""], date: dayjs().format("YYYY-MM-DD") });
  const [extraValuesModal, setExtraValuesModal] = useState({ open: false, values: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const loadAttributes = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAttributes();
      setAttributes(data);
    } catch (err) {
      setError(err.message || "Failed to load attributes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttributes();
  }, []);

  const handleValueChange = (index, value) => {
    const updated = [...formData.values];
    updated[index] = value;
    setFormData({ ...formData, values: updated });
  };

  const addValueField = () => setFormData({ ...formData, values: [...formData.values, ""] });
  const removeValueField = (index) => {
    const updated = formData.values.filter((_, i) => i !== index);
    setFormData({ ...formData, values: updated.length ? updated : [""] });
  };

  const handleDeleteAttribute = async (id) => {
    if (!window.confirm("Delete this attribute?")) return;
    try {
      await deleteAttribute(id);
      setAttributes((prev) => prev.filter((attr) => attr.id !== id));
    } catch (err) {
      alert(err.message || "Failed to delete attribute");
    }
  };

  const filteredAttributes = attributes.filter((attr) =>
    attr.name.toLowerCase().includes(search.toLowerCase())
  );
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentAttributes = filteredAttributes.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(filteredAttributes.length / itemsPerPage));

  const saveModal = async () => {
    if (!formData.name.trim() || formData.values.some((v) => !v.trim())) return;

    const payload = {
      name: formData.name.trim(),
      values: formData.values.map((v) => v.trim()).filter(Boolean),
    };

    try {
      if (editingAttribute) {
        const saved = await updateAttribute(editingAttribute.id, payload);
        setAttributes((prev) => prev.map((attr) => (attr.id === saved.id ? saved : attr)));
      } else {
        const saved = await createAttribute(payload);
        setAttributes((prev) => [...prev, saved]);
      }
      setModalOpen(false);
    } catch (err) {
      alert(err.message || "Failed to save attribute");
    }
  };

  const openAddModal = () => {
    setEditingAttribute(null);
    setFormData({ name: "", values: [""], date: dayjs().format("YYYY-MM-DD") });
    setModalOpen(true);
  };

  const openEditModal = (attr) => {
    setEditingAttribute(attr);
    setFormData({ name: attr.name, values: [...attr.values], date: attr.date });
    setModalOpen(true);
  };

  const openExtraValuesModal = (values) => setExtraValuesModal({ open: true, values });
  const closeExtraValuesModal = () => setExtraValuesModal({ open: false, values: [] });

  return (
    <div className="attributes-page">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className={`admin-content ${sidebarOpen ? "" : "sidebar-closed"}`}>
        <h1 className="page-title">Attributes</h1>

        {error && <p className="error-text">{error}</p>}

        <div className="attributes-cards">
          <div className="attr-card total-card">
            <div className="card-icon"><FaLayerGroup /></div>
            <h3>Total Attributes</h3>
            <p>{attributes.length}</p>
          </div>
          <div className="attr-card most-used-card">
            <div className="card-icon"><FaStar /></div>
            <h3>Most Used Attribute</h3>
            <p>
              {attributes.length
                ? attributes.reduce((best, curr) =>
                    curr.values.length > best.values.length ? curr : best
                  ).name
                : "N/A"}
            </p>
          </div>
          <div className="attr-card recent-card">
            <div className="card-icon"><FaClock /></div>
            <h3>Recently Added</h3>
            <p>
              {attributes.length
                ? attributes.reduce((latest, curr) =>
                    new Date(curr.date) > new Date(latest.date) ? curr : latest
                  ).name
                : "N/A"}
            </p>
          </div>
        </div>

        <div className="top-bar">
          <input
            type="text"
            placeholder="Search attributes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="add-btn" onClick={openAddModal}>+ Add Attribute</button>
        </div>

        {loading ? (
          <p>Loading attributes...</p>
        ) : (
          <div className="attributes-table-wrapper">
            <table className="attributes-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Values</th>
                  <th>Date Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentAttributes.map((attr) => {
                  const visibleValues = attr.values.slice(0, 2);
                  const hiddenCount = attr.values.length - visibleValues.length;
                  return (
                    <tr key={attr.id}>
                      <td>{attr.name}</td>
                      <td>
                        <div className="values-list">
                          {visibleValues.map((v, i) => <span key={i} className="value-pill">{v}</span>)}
                          {hiddenCount > 0 && (
                            <span
                              className="value-pill more"
                              onClick={() => openExtraValuesModal(attr.values.slice(2))}
                            >
                              +{hiddenCount} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{attr.date}</td>
                      <td className="actions-col">
                        <button className="action-btn edit-btn" onClick={() => openEditModal(attr)}><FaEdit /></button>
                        <button className="action-btn delete-btn" onClick={() => handleDeleteAttribute(attr.id)}><FaTrash /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="pagination">
              <button onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1}>Previous</button>
              <span>Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages}>Next</button>
            </div>
          </div>
        )}

        {modalOpen && (
          <AttributeModal
            title={editingAttribute ? "Edit Attribute" : "Add Attribute"}
            formData={formData}
            setFormData={setFormData}
            addValueField={addValueField}
            removeValueField={removeValueField}
            handleValueChange={handleValueChange}
            saveModal={saveModal}
            closeModal={() => setModalOpen(false)}
          />
        )}

        {extraValuesModal.open && (
          <ExtraValuesModal
            values={extraValuesModal.values}
            closeModal={closeExtraValuesModal}
          />
        )}
      </div>
    </div>
  );
};

export default AttributesPage;
