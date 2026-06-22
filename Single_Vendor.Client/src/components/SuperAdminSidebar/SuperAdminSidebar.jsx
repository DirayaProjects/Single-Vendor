import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearSuperAdminToken } from "../../services/superAdminAuth";
import "./superAdminSidebar.css";
import { FaTachometerAlt, FaUserShield, FaSignOutAlt, FaBars } from "react-icons/fa";

const SuperAdminSidebar = ({ onToggle }) => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    clearSuperAdminToken();
    navigate("/login");
  };

  useEffect(() => {
    if (onToggle) onToggle(isOpen);
  }, [isOpen, onToggle]);

  return (
    <div className={`superadmin-sidebar ${isOpen ? "open" : "closed"}`}>
      <div className="top-section">
        <div>
          {isOpen && (
            <>
              <h1 className="logo" style={{ margin: 0, fontSize: "18px" }}>
                SuperAdmin
              </h1>
              <div className="logo-badge">PLATFORM</div>
            </>
          )}
        </div>
        <div className="toggle-btn" onClick={toggleSidebar}>
          <FaBars />
        </div>
      </div>

      <ul className="menu">
        <li>
          <NavLink
            to="/superadmin/dashboard"
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <FaTachometerAlt className="icon" />
            {isOpen && <span>Dashboard</span>}
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/superadmin/store-admins"
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <FaUserShield className="icon" />
            {isOpen && <span>Store admins</span>}
          </NavLink>
        </li>
        <li onClick={handleLogout}>
          <div className="nav-item logout">
            <FaSignOutAlt className="icon" />
            {isOpen && <span>Logout</span>}
          </div>
        </li>
      </ul>
    </div>
  );
};

export default SuperAdminSidebar;
