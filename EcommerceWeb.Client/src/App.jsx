import React from 'react';
import './Styles/colors.css';
import LoginPage from './Pages/Login/login';
import Landing from './Pages/landing/landing';
import Dashboard from './Pages/Admin/Dashboard/dashboard';
import Orders from './Pages/Admin/Orders/orders';
import AttributesPage from "./Pages/Admin/Attributes/AttributesPage";
import CategoriesPage from "./Pages/Admin/Categories/CategoriesPage";
import ProductsPage from "./Pages/Admin/Products/products";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AllProducts from './Pages/AllProducts/allProducts';
import Cart from './Pages/Cart/cart';
import Item from './Pages/Items/item';
import Wishlist from './Pages/Wishlist/wishlist';
import MyOrders from './Pages/Orders/myOrders';
import Deals from './Pages/Deals/deals';
import SettingsPage from './Pages/Admin/Settings/settings';
import StorefrontLayout from './components/StorefrontLayout/StorefrontLayout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route path="/s/:slug" element={<StorefrontLayout />}>
          <Route index element={<Landing />} />
          <Route path="products" element={<AllProducts />} />
          <Route path="item/:id" element={<Item />} />
          <Route path="cart" element={<Cart />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="orders" element={<MyOrders />} />
          <Route path="deals" element={<Deals />} />
        </Route>

        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/products" element={<Navigate to="/" replace />} />
        <Route path="/cart" element={<Navigate to="/" replace />} />
        <Route path="/item" element={<Navigate to="/" replace />} />

        <Route
          path="/admin/*"
          element={
            <div>
              <Routes>
                <Route path="" element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="orders" element={<Orders />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="attributes" element={<AttributesPage />} />
                <Route path='settings' element={<SettingsPage />} />
              </Routes>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
