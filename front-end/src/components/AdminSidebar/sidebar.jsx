import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./sidebar.css";
import {
  FaTachometerAlt,
  FaShoppingCart,
  FaBoxOpen,
  FaTags,
  FaCogs,
  FaSignOutAlt,
  FaBars,
} from "react-icons/fa";

const Sidebar = ({ onToggle }) => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    navigate("/");
  };

  useEffect(() => {
    if (onToggle) onToggle(isOpen);
  }, [isOpen, onToggle]);

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <div className="top-section">
        {isOpen && <h1 className="logo">Admin</h1>}
        <div className="toggle-btn" onClick={toggleSidebar}>
          <FaBars />
        </div>
      </div>

      <ul className="menu">

        <li>
          <NavLink to="/admin/dashboard" className="nav-item">
            <FaTachometerAlt className="icon" />
            {isOpen && <span>Dashboard</span>}
          </NavLink>
        </li>

        <li>
          <NavLink to="/admin/orders" className="nav-item">
            <FaShoppingCart className="icon" />
            {isOpen && <span>Orders</span>}
          </NavLink>
        </li>

        <li>
          <NavLink to="/admin/products" className="nav-item">
            <FaBoxOpen className="icon" />
            {isOpen && <span>Products</span>}
          </NavLink>
        </li>

        <li>
          <NavLink to="/admin/categories" className="nav-item">
            <FaTags className="icon" />
            {isOpen && <span>Categories</span>}
          </NavLink>
        </li>

        <li>
          <NavLink to="/admin/attributes" className="nav-item">
            <FaCogs className="icon" />
            {isOpen && <span>Attributes</span>}
          </NavLink>
        </li>

         <li onClick={handleLogout}>
            <div className="nav-item">
                <FaSignOutAlt className="icon" />
                <span>Logout</span>
            </div>
        </li>


      </ul>
    </div>
  );
};

export default Sidebar;
