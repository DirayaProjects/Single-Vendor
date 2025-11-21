import React, { useState } from "react";
import Sidebar from "../../../components/AdminSidebar/sidebar";
import AttributeModal from "./AttributesModal";
import ExtraValuesModal from "./ExtraValuesModal";
import "./AttributesPage.css";
import { FaEdit, FaTrash, FaLayerGroup, FaStar, FaClock } from "react-icons/fa";
import dayjs from "dayjs";

const initialAttributes = [
  { id: 1, name: "Color", values: ["Red", "Blue", "Green", "Yellow"], date: "2025-11-16" },
  { id: 2, name: "Size", values: ["S", "M", "L"], date: "2025-11-15" },
  { id: 3, name: "Material", values: ["Cotton"], date: "2025-11-14" },
];

const AttributesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [attributes, setAttributes] = useState(initialAttributes);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [formData, setFormData] = useState({ name: "", values: [""], date: dayjs().format("YYYY-MM-DD") });
  const [extraValuesModal, setExtraValuesModal] = useState({ open: false, values: [] });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

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

  const handleAddAttribute = (attr) => setAttributes([...attributes, { id: Date.now(), ...attr }]);
  const handleEditAttribute = (updatedAttr) =>
    setAttributes(attributes.map(attr => attr.id === updatedAttr.id ? updatedAttr : attr));
  const handleDeleteAttribute = (id) => setAttributes(attributes.filter(attr => attr.id !== id));

  const filteredAttributes = attributes.filter(attr => attr.name.toLowerCase().includes(search.toLowerCase()));
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentAttributes = filteredAttributes.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredAttributes.length / itemsPerPage);

  const saveModal = () => {
    if (!formData.name.trim() || formData.values.some(v => !v.trim())) return;
    const formatted = { ...formData, date: dayjs(formData.date).format("YYYY-MM-DD") };
    editingAttribute ? handleEditAttribute({ ...formatted, id: editingAttribute.id }) : handleAddAttribute(formatted);
    setModalOpen(false);
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

        {/* CARDS */}
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
                ? Object.entries(attributes.reduce((acc, curr) => {
                    acc[curr.name] = (acc[curr.name] || 0) + 1;
                    return acc;
                  }, {})).sort((a, b) => b[1] - a[1])[0][0]
                : "N/A"}
            </p>
          </div>
          <div className="attr-card recent-card">
            <div className="card-icon"><FaClock /></div>
            <h3>Recently Added</h3>
            <p>{attributes.length ? attributes.reduce((latest, curr) => new Date(curr.date) > new Date(latest.date) ? curr : latest).name : "N/A"}</p>
          </div>
        </div>

        {/* TOP BAR */}
        <div className="top-bar">
          <input
            type="text"
            placeholder="Search attributes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="add-btn" onClick={openAddModal}>+ Add Attribute</button>
        </div>

        {/* TABLE */}
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
              {currentAttributes.map(attr => {
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

          {/* PAGINATION */}
          <div className="pagination">
            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>Previous</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>Next</button>
          </div>
        </div>

        {/* MODALS */}
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
