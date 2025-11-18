import React, { useState } from "react";
import Sidebar from "../../../components/AdminSidebar/sidebar";
import "./AttributesPage.css";
import { FaEdit, FaTrash, FaLayerGroup, FaStar, FaClock } from "react-icons/fa";
import dayjs from "dayjs";

const initialAttributes = [
  { id: 1, name: "Color", value: "Red", date: "2025-11-16" },
  { id: 2, name: "Size", value: "M", date: "2025-11-15" },
  { id: 3, name: "Material", value: "Cotton", date: "2025-11-14" },
  { id: 4, name: "Pattern", value: "Striped", date: "2025-11-12" },
  { id: 5, name: "Style", value: "Casual", date: "2025-11-10" },
];

const AttributesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [attributes, setAttributes] = useState(initialAttributes);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [formData, setFormData] = useState({ name: "", value: "", date: dayjs().format("YYYY-MM-DD") });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const handleAddAttribute = (attr) => {
    setAttributes([...attributes, { id: Date.now(), ...attr }]);
  };

  const handleEditAttribute = (updatedAttr) => {
    setAttributes(attributes.map((attr) => (attr.id === updatedAttr.id ? updatedAttr : attr)));
  };

  const handleDeleteAttribute = (id) => {
    setAttributes(attributes.filter((attr) => attr.id !== id));
  };

  const filteredAttributes = attributes.filter((attr) =>
    attr.name.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination logic
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentAttributes = filteredAttributes.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredAttributes.length / itemsPerPage);

  // Modal save
  const saveModal = () => {
    if (!formData.name || !formData.value) return;
    const attr = { ...formData };
    attr.date = dayjs(attr.date).format("YYYY-MM-DD");
    editingAttribute ? handleEditAttribute({ ...attr, id: editingAttribute.id }) : handleAddAttribute(attr);
    setModalOpen(false);
    setFormData({ name: "", value: "", date: dayjs().format("YYYY-MM-DD") });
  };

  const openAddModal = () => {
    setEditingAttribute(null);
    setFormData({ name: "", value: "", date: dayjs().format("YYYY-MM-DD") });
    setModalOpen(true);
  };

  const openEditModal = (attr) => {
    setEditingAttribute(attr);
    setFormData({ name: attr.name, value: attr.value, date: attr.date });
    setModalOpen(true);
  };

  return (
    <div>
      <Sidebar onToggle={setSidebarOpen} />
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
        ? Object.entries(
            attributes.reduce((acc, curr) => {
              acc[curr.name] = (acc[curr.name] || 0) + 1;
              return acc;
            }, {})
          )
            .sort((a, b) => b[1] - a[1])[0][0]
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

        {/* TOP BAR */}
        <div className="top-bar">
          <input
            type="text"
            placeholder="Search attributes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="add-btn" onClick={openAddModal}>
            + Add Attribute
          </button>
        </div>

        {/* TABLE */}
        <div className="attributes-table-wrapper">
          <table className="attributes-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Value</th>
                <th>Date Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentAttributes.map((attr) => (
                <tr key={attr.id}>
                  <td data-label="Name">{attr.name}</td>
                  <td data-label="Value">{attr.value}</td>
                  <td data-label="Date Added">{attr.date}</td>
                  <td className="actions-col">
                    <button className="action-btn edit-btn" onClick={() => openEditModal(attr)}>
                      <FaEdit />
                    </button>
                    <button className="action-btn delete-btn" onClick={() => handleDeleteAttribute(attr.id)}>
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* PAGINATION */}
          <div className="pagination">
            <button onClick={() => setCurrentPage((prev) => prev - 1)} disabled={currentPage === 1}>
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button onClick={() => setCurrentPage((prev) => prev + 1)} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        </div>

        {/* MODAL */}
        {modalOpen && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <h2>{editingAttribute ? "Edit Attribute" : "Add Attribute"}</h2>
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
              <div className="modal-buttons">
                <button onClick={() => setModalOpen(false)}>Cancel</button>
                <button onClick={saveModal}>{editingAttribute ? "Save" : "Add"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttributesPage;
