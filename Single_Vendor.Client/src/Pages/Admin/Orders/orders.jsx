import React, { useState, useRef, useEffect, useCallback } from "react";
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
import jsPDF from "jspdf";
import "jspdf-autotable";
import dayjs from "dayjs";
import { adminApi } from "../../../services/adminApi";

const fmtMoney = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(
    Number(n) || 0
  );

function mapApiOrder(o) {
  return {
    id: o.orderId,
    orderId: o.orderId,
    customer: o.customerName,
    customerEmail: o.customerEmail || "",
    subTotal: o.subTotal,
    discountAmount: o.discountAmount,
    deliveryFee: o.deliveryFee,
    total: o.total,
    totalFmt: fmtMoney(o.total),
    status: o.status,
    date: o.orderDate,
    description: o.notes || "",
  };
}

const Orders = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [orders, setOrders] = useState([]);
  const [listError, setListError] = useState("");
  const [loading, setLoading] = useState(true);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [formData, setFormData] = useState({
    customer: "",
    customerEmail: "",
    subTotal: "0",
    discountAmount: "0",
    deliveryFee: "0",
    total: "0",
    status: "Pending",
    date: dayjs(),
    description: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const loadOrders = useCallback(async () => {
    setListError("");
    setLoading(true);
    try {
      const list = await adminApi("/api/admin/orders");
      setOrders((list || []).map(mapApiOrder));
    } catch (e) {
      setListError(e.message || "Failed to load orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.customer.toLowerCase().includes(search.toLowerCase()) || String(o.id).includes(search);
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

  const [exportOpen, setExportOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const offset = useRef({ x: 0, y: 0 });

  const toggleExport = () => setExportOpen(!exportOpen);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    offset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPosition({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
  };

  const handleMouseUp = () => setDragging(false);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setDragging(true);
    offset.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
  };

  const handleTouchMove = (e) => {
    if (!dragging) return;
    const touch = e.touches[0];
    setPosition({ x: touch.clientX - offset.current.x, y: touch.clientY - offset.current.y });
  };

  const handleTouchEnd = () => setDragging(false);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  });

  const exportCSV = () => {
    let csv = "Order ID,Customer,Total,Status,Date,Notes\n";
    filteredOrders.forEach((o) => {
      csv += `${o.id},${o.customer},${o.totalFmt},${o.status},${o.date},${(o.description || "").replace(/,/g, " ")}\n`;
    });
    saveAs(new Blob([csv], { type: "text/csv;charset=utf-8" }), "orders.csv");
    setExportOpen(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["ID", "Customer", "Total", "Status", "Date", "Notes"];
    const tableRows = filteredOrders.map((o) => [
      o.id,
      o.customer,
      o.totalFmt,
      o.status,
      o.date,
      o.description || "",
    ]);
    doc.autoTable({ head: [tableColumn], body: tableRows });
    doc.save("orders.pdf");
    setExportOpen(false);
  };

  const exportWord = () => {
    let content =
      "<table border='1'><tr><th>ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th><th>Notes</th></tr>";
    filteredOrders.forEach((o) => {
      content += `<tr><td>${o.id}</td><td>${o.customer}</td><td>${o.totalFmt}</td><td>${o.status}</td><td>${o.date}</td><td>${o.description || ""}</td></tr>`;
    });
    content += "</table>";
    const blob = new Blob(["\ufeff", content], { type: "application/msword" });
    saveAs(blob, "orders.doc");
    setExportOpen(false);
  };

  const printOrders = () => {
    const printWindow = window.open("", "_blank");
    let html =
      "<h2>Orders</h2><table border='1' style='border-collapse: collapse; width:100%;'><tr><th>ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th><th>Notes</th></tr>";
    filteredOrders.forEach((o) => {
      html += `<tr><td>${o.id}</td><td>${o.customer}</td><td>${o.totalFmt}</td><td>${o.status}</td><td>${o.date}</td><td>${o.description || ""}</td></tr>`;
    });
    html += "</table>";
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
    setExportOpen(false);
  };

  const handleEdit = (order) => {
    setCurrentOrder(order);
    setFormData({
      customer: order.customer,
      customerEmail: order.customerEmail || "",
      subTotal: String(order.subTotal ?? 0),
      discountAmount: String(order.discountAmount ?? 0),
      deliveryFee: String(order.deliveryFee ?? 0),
      total: String(order.total ?? 0),
      status: order.status,
      date: dayjs(order.date),
      description: order.description || "",
    });
    setOpenEdit(true);
  };

  const saveEdit = async () => {
    if (!formData.customer || !formData.status || !formData.date || !currentOrder) return;
    try {
      await adminApi(`/api/admin/orders/${currentOrder.orderId}`, {
        method: "PUT",
        json: {
          customerName: formData.customer.trim(),
          customerEmail: formData.customerEmail?.trim() || null,
          status: formData.status,
          orderDate: dayjs(formData.date).format("YYYY-MM-DD"),
          notes: formData.description?.trim() || null,
          subTotal: Number(formData.subTotal) || 0,
          discountAmount: Number(formData.discountAmount) || 0,
          deliveryFee: Number(formData.deliveryFee) || 0,
          total: Number(formData.total) || 0,
        },
      });
      await loadOrders();
      setOpenEdit(false);
      setCurrentOrder(null);
    } catch (e) {
      window.alert(e.message || "Update failed");
    }
  };

  const saveAdd = async () => {
    if (!formData.customer || !formData.status || !formData.date) return;
    try {
      await adminApi("/api/admin/orders", {
        method: "POST",
        json: {
          customerName: formData.customer.trim(),
          customerEmail: formData.customerEmail?.trim() || null,
          status: formData.status,
          orderDate: dayjs(formData.date).format("YYYY-MM-DD"),
          notes: formData.description?.trim() || null,
          items: null,
        },
      });
      await loadOrders();
      setOpenAdd(false);
      setFormData({
        customer: "",
        customerEmail: "",
        subTotal: "0",
        discountAmount: "0",
        deliveryFee: "0",
        total: "0",
        status: "Pending",
        date: dayjs(),
        description: "",
      });
      setCurrentPage(1);
    } catch (e) {
      window.alert(e.message || "Create failed");
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("Delete this order permanently?")) return;
    try {
      await adminApi(`/api/admin/orders/${id}`, { method: "DELETE" });
      await loadOrders();
    } catch (e) {
      window.alert(e.message || "Delete failed");
    }
  };

  const openAddModal = () => {
    setFormData({
      customer: "",
      customerEmail: "",
      subTotal: "0",
      discountAmount: "0",
      deliveryFee: "0",
      total: "0",
      status: "Pending",
      date: dayjs(),
      description: "",
    });
    setOpenAdd(true);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="orders-page">
        <Sidebar onToggle={setSidebarOpen} />
        <div className={`orders-content ${sidebarOpen ? "" : "sidebar-closed"}`}>
          <h2>
            <FaShoppingCart /> Orders Management
          </h2>

          {listError && <p className="orders-api-error">{listError}</p>}
          {loading && <p className="orders-api-hint">Loading…</p>}

          <div className="filters-row">
            <TextField
              placeholder="Search orders..."
              variant="outlined"
              size="small"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaSearch />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: { xs: "100%", sm: 220 } }}
            />

            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Shipped">Shipped</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </TextField>

            <DatePicker
              label="From"
              value={startDate}
              onChange={(newVal) => {
                setStartDate(newVal);
                setCurrentPage(1);
              }}
              slotProps={{ textField: { size: "small" } }}
            />

            <DatePicker
              label="To"
              value={endDate}
              onChange={(newVal) => {
                setEndDate(newVal);
                setCurrentPage(1);
              }}
              slotProps={{ textField: { size: "small" } }}
            />

            <Button variant="outlined" startIcon={<FaPlus />} onClick={openAddModal}>
              Add order
            </Button>

            <Button variant="outlined" onClick={() => loadOrders()}>
              Refresh
            </Button>

            <div
              className="export-dropdown"
              ref={dropdownRef}
              style={{
                top: position.y,
                right: position.x,
                zIndex: 9999,
                cursor: dragging ? "grabbing" : "grab",
              }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              <Button variant="contained" className="primary-btn" startIcon={<FaDownload />} onClick={toggleExport}>
                Export ▼
              </Button>

              {exportOpen && (
                <div
                  className="export-menu"
                  style={{
                    position: "absolute",
                    background: "#fff",
                    border: "1px solid #d1d5db",
                    borderRadius: "10px",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                    zIndex: 9999,
                    minWidth: "130px",
                    cursor: "default",
                  }}
                >
                  <div className="export-item" onClick={exportCSV}>
                    CSV
                  </div>
                  <div className="export-item" onClick={exportPDF}>
                    PDF
                  </div>
                  <div className="export-item" onClick={exportWord}>
                    Word
                  </div>
                  <div className="export-item" onClick={printOrders}>
                    Print
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="orders-table-wrapper">
            <table className="orders-table" role="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customer}</td>
                    <td>{order.totalFmt}</td>
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
                      <IconButton size="small" color="error" onClick={() => deleteOrder(order.id)} aria-label="delete">
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

          <div className="pagination">
            <button type="button" onClick={goToPrev} disabled={currentPage === 1}>
              Previous
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                type="button"
                className={currentPage === i + 1 ? "active" : ""}
                onClick={() => goToPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button type="button" onClick={goToNext} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>

          <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="sm">
            <DialogTitle>New order</DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <TextField
                label="Customer name"
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                fullWidth
                margin="dense"
              />
              <TextField
                label="Email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                fullWidth
                margin="dense"
              />
              <TextField
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                fullWidth
                margin="dense"
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Shipped">Shipped</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </TextField>
              <DatePicker
                label="Order date"
                value={formData.date}
                onChange={(v) => v && setFormData({ ...formData, date: v })}
                slotProps={{ textField: { fullWidth: true, margin: "dense" } }}
              />
              <TextField
                label="Notes"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                margin="dense"
                multiline
                minRows={2}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenAdd(false)} startIcon={<FaTimes />}>
                Cancel
              </Button>
              <Button variant="contained" onClick={saveAdd}>
                Save
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
            <DialogTitle>Edit order #{currentOrder?.orderId}</DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <TextField
                label="Customer name"
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                fullWidth
                margin="dense"
              />
              <TextField
                label="Email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                fullWidth
                margin="dense"
              />
              <TextField
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                fullWidth
                margin="dense"
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Shipped">Shipped</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </TextField>
              <DatePicker
                label="Order date"
                value={formData.date}
                onChange={(v) => v && setFormData({ ...formData, date: v })}
                slotProps={{ textField: { fullWidth: true, margin: "dense" } }}
              />
              <TextField
                label="Subtotal"
                type="number"
                value={formData.subTotal}
                onChange={(e) => setFormData({ ...formData, subTotal: e.target.value })}
                fullWidth
                margin="dense"
              />
              <TextField
                label="Discount"
                type="number"
                value={formData.discountAmount}
                onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                fullWidth
                margin="dense"
              />
              <TextField
                label="Delivery fee"
                type="number"
                value={formData.deliveryFee}
                onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                fullWidth
                margin="dense"
              />
              <TextField
                label="Total"
                type="number"
                value={formData.total}
                onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                fullWidth
                margin="dense"
              />
              <TextField
                label="Notes"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                margin="dense"
                multiline
                minRows={2}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenEdit(false)} startIcon={<FaTimes />}>
                Cancel
              </Button>
              <Button variant="contained" onClick={saveEdit}>
                Save
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </div>
    </LocalizationProvider>
  );
};

export default Orders;
