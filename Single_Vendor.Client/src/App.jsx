import React from 'react';
import './Styles/colors.css';     
import RootEntry from './Pages/RootEntry';
import Dashboard from './Pages/Admin/Dashboard/dashboard';
import Orders from './Pages/Admin/Orders/orders';
import AttributesPage from "./Pages/Admin/Attributes/AttributesPage";
import CategoriesPage from "./Pages/Admin/Categories/CategoriesPage";
import ProductsPage from "./Pages/Admin/Products/products";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import AllProducts from './Pages/AllProducts/allProducts';
import Cart from  './Pages/Cart/cart';
import Item from './Pages/Items/item';
import SettingsPage from './Pages/Admin/Settings/settings';
import UnifiedLogin from "./Pages/Login/UnifiedLogin";
import StorefrontSlugLayout from "./components/StorefrontSlugLayout/StorefrontSlugLayout";
import { RequireAdmin } from './components/auth/RequireAdmin';
import { RequireCustomer } from './components/auth/RequireCustomer';
import { RequireSuperAdmin } from './components/auth/RequireSuperAdmin';
import AccountHome from './Pages/Account/AccountHome';
import SuperAdminDashboard from './Pages/SuperAdmin/Dashboard/superAdminDashboard';
import StoreAdminsPage from './Pages/SuperAdmin/StoreAdmins/storeAdminsPage';
import StorefrontThemeSync from './components/StorefrontThemeSync/StorefrontThemeSync';
import { CartProvider } from './contexts/CartContext';
import { StorefrontSettingsProvider } from './contexts/StorefrontSettingsContext';
import { AdminStoreProvider } from './contexts/AdminStoreContext';

function AdminLayout() {
  return (
    <div>
      <Outlet />
    </div>
  );
}

function AdminStoreShell() {
  return (
    <AdminStoreProvider>
      <Outlet />
    </AdminStoreProvider>
  );
}

function App() {
  return (
    <Router>
      <StorefrontSettingsProvider>
      <StorefrontThemeSync />
      <CartProvider>
      <Routes>
        <Route path="/" element={<RootEntry />} />
        <Route path="/portal" element={<RootEntry />} />
        <Route path="/login" element={<UnifiedLogin />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
        <Route path="/superadmin/login" element={<Navigate to="/login" replace />} />

        <Route element={<StorefrontSlugLayout />}>
          <Route path="/products" element={<AllProducts />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/item" element={<Item />} />
        </Route>

        <Route path="/superadmin" element={<RequireSuperAdmin />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="store-admins" element={<StoreAdminsPage />} />
          </Route>
        </Route>

        <Route path="/admin" element={<RequireAdmin />}>
          <Route element={<AdminStoreShell />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="attributes" element={<AttributesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          </Route>
        </Route>

        <Route path="/account" element={<RequireCustomer />}>
          <Route index element={<AccountHome />} />
        </Route>
      </Routes>
      </CartProvider>
      </StorefrontSettingsProvider>
    </Router>
  );
}

export default App;
