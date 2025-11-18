import React, { useState } from "react";
import "./orders.css";
import Sidebar from "../../../components/AdminSidebar/sidebar";
import {
  TextField,
  MenuItem,
  Button,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { FaSearch, FaTrash, FaEdit, FaPlus, FaDownload, FaShoppingCart, FaTimes } from "react-icons/fa";
import { saveAs } from "file-saver";
import dayjs from "dayjs";

const Orders = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [orders, setOrders] = useState([
    { id: 1, customer: "John Doe", total: "$120", status: "Completed", date: "2025-01-01", description: "Electronics" },
    { id: 2, customer: "Jane Smith", total: "$75.50", status: "Pending", date: "2025-01-05", description: "Clothing" },
    { id: 3, customer: "Mike Johnson", total: "$200", status: "Completed", date: "2025-01-10", description: "Toys" },
  ]);

  // Modal & form state
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [formData, setFormData] = useState({ customer: "", total: "", status: "Pending", date: dayjs(), description: "" });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filtering
  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.toString().includes(search);
    const matchesStatus = statusFilter === "All" ? true : o.status === statusFilter;
    const matchesStartDate = startDate ? dayjs(o.date).isAfter(startDate.subtract(1, "day")) : true;
    const matchesEndDate = endDate ? dayjs(o.date).isBefore(endDate.add(1, "day")) : true;
    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const displayedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToPrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPage = (page) => setCurrentPage(page);

  // Export CSV
  const exportCSV = () => {
    let csv = "Order ID,Customer,Total,Status,Date,Description\n";
    filteredOrders.forEach((o) => {
      csv += `${o.id},${o.customer},${o.total},${o.status},${o.date},${o.description}\n`;
    });
    saveAs(new Blob([csv], { type: "text/csv;charset=utf-8" }), "orders.csv");
  };

  // Edit / Add handlers
  const handleEdit = (order) => {
    setCurrentOrder(order);
    setFormData({ customer: order.customer, total: order.total, status: order.status, date: dayjs(order.date), description: order.description });
    setOpenEdit(true);
  };

  const saveEdit = () => {
    if (!formData.customer || !formData.total || !formData.status || !formData.date) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === currentOrder.id
          ? { ...o, ...formData, date: dayjs(formData.date).format("YYYY-MM-DD") }
          : o
      )
    );
    setOpenEdit(false);
    setCurrentOrder(null);
  };

  const saveAdd = () => {
    if (!formData.customer || !formData.total || !formData.status || !formData.date) return;
    const newOrder = { id: orders.length + 1, ...formData, date: dayjs(formData.date).format("YYYY-MM-DD") };
    setOrders([...orders, newOrder]);
    setOpenAdd(false);
    setFormData({ customer: "", total: "", status: "Pending", date: dayjs(), description: "" });
    setCurrentPage(1);
  };

  const deleteOrder = (id) => {
    if (!window.confirm("Delete this order?")) return;
    setOrders(orders.filter((o) => o.id !== id));
  };

  // Open Add modal preset
  const openAddModal = () => {
    setFormData({ customer: "", total: "", status: "Pending", date: dayjs(), description: "" });
    setOpenAdd(true);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="orders-page">
        <Sidebar onToggle={setSidebarOpen} />
        <div className={`orders-content ${sidebarOpen ? "" : "sidebar-closed"}`}>
          <h2><FaShoppingCart /> Orders Management</h2>

          {/* Filters + actions */}
          <div className="filters-row">
            <TextField
              placeholder="Search orders..."
              variant="outlined"
              size="small"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><FaSearch /></InputAdornment> }}
              sx={{ minWidth: { xs: "100%", sm: 220 } }}
            />

            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
            </TextField>

            <DatePicker
              label="From"
              value={startDate}
              onChange={(newVal) => { setStartDate(newVal); setCurrentPage(1); }}
              slotProps={{ textField: { size: "small" } }}
            />

            <DatePicker
              label="To"
              value={endDate}
              onChange={(newVal) => { setEndDate(newVal); setCurrentPage(1); }}
              slotProps={{ textField: { size: "small" } }}
            />

            <div className="filter-buttons">
              <Button variant="contained" className="primary-btn" startIcon={<FaPlus />} onClick={openAddModal}>Add Order</Button>
              <Button variant="contained" className="primary-btn" startIcon={<FaDownload />} onClick={exportCSV}>Export CSV</Button>
            </div>
          </div>

          {/* Table */}
          <div className="orders-table-wrapper">
            <table className="orders-table" role="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customer}</td>
                    <td>{order.total}</td>
                    <td>
                      <span className={`status-badge ${order.status === "Completed" ? "completed" : "pending"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{order.date}</td>
                    <td>{order.description}</td>
                    <td className="actions-cell">
                      <IconButton size="small" onClick={() => handleEdit(order)} aria-label="edit">
                        <FaEdit />
                      </IconButton>
                      <IconButton  className="del"size="small" color="error" onClick={() => deleteOrder(order.id)} aria-label="delete">
                        <FaTrash />
                      </IconButton>
                    </td>
                  </tr>
                ))}

                {displayedOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: "28px", textAlign: "center", color: "#666" }}>
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button onClick={goToPrev} disabled={currentPage === 1}>Previous</button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} className={currentPage === i + 1 ? "active" : ""} onClick={() => goToPage(i + 1)}>
                {i + 1}
              </button>
            ))}
            <button onClick={goToNext} disabled={currentPage === totalPages}>Next</button>
          </div>

          {/* ADD Dialog */}
          <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="sm">
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pr: 0 }}>
              Add Order
              <button className="modal-close-btn" onClick={() => setOpenAdd(false)} aria-label="close">
                <FaTimes />
              </button>
            </DialogTitle>

            <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }} className="modal-new-content">
              <TextField
                label="Customer"
                fullWidth
                variant="outlined"
                margin="dense"
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              />
              <TextField
                label="Total"
                fullWidth
                variant="outlined"
                margin="dense"
                value={formData.total}
                onChange={(e) => setFormData({ ...formData, total: e.target.value })}
              />
              <TextField
                label="Description"
                fullWidth
                variant="outlined"
                margin="dense"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <TextField
                select
                label="Status"
                fullWidth
                margin="dense"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
              </TextField>
              <DatePicker
                label="Date"
                value={formData.date}
                onChange={(newVal) => setFormData({ ...formData, date: newVal })}
                slotProps={{ textField: { size: "small", margin: "dense" } }}
              />
            </DialogContent>

            <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }} className="modal-new-actions">
              {/* <Button onClick={() => setOpenAdd(false)} className="primary-btn-outline">Cancel</Button> */}
              <Button onClick={saveAdd} className="primary-btn" variant="contained">Save</Button>
            </DialogActions>
          </Dialog>

          {/* EDIT Dialog */}
          <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pr: 0 }}>
              Edit Order
              <button className="modal-close-btn" onClick={() => setOpenEdit(false)} aria-label="close">
                <FaTimes />
              </button>
            </DialogTitle>

            <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }} className="modal-new-content">
              <TextField
                label="Customer"
                fullWidth
                variant="outlined"
                margin="dense"
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              />
              <TextField
                label="Total"
                fullWidth
                variant="outlined"
                margin="dense"
                value={formData.total}
                onChange={(e) => setFormData({ ...formData, total: e.target.value })}
              />
              <TextField
                label="Description"
                fullWidth
                variant="outlined"
                margin="dense"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <TextField
                select
                label="Status"
                fullWidth
                margin="dense"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
              </TextField>
              <DatePicker
                label="Date"
                value={formData.date}
                onChange={(newVal) => setFormData({ ...formData, date: newVal })}
                slotProps={{ textField: { size: "small", margin: "dense" } }}
              />
            </DialogContent>

            <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }} className="modal-new-actions">
              {/* <Button onClick={() => setOpenEdit(false)} className="primary-btn-outline">Cancel</Button> */}
              <Button onClick={saveEdit} className="primary-btn" variant="contained">Save</Button>
            </DialogActions>
          </Dialog>
        </div>
      </div>
    </LocalizationProvider>
  );
};

export default Orders;
