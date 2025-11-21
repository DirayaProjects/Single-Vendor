import React from 'react';
import './Styles/colors.css';     
import Landing from './Pages/landing/landing';
import Dashboard from './Pages/Admin/Dashboard/dashboard';
import Orders from './Pages/Admin/Orders/orders';
import AttributesPage from "./Pages/Admin/Attributes/AttributesPage";
import CategoriesPage from "./Pages/Admin/Categories/CategoriesPage";
import ProductsPage from "./Pages/Admin/Products/products";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AllProducts from './Pages/AllProducts/allProducts';
import Cart from  './Pages/Cart/cart';
import Item from './Pages/Items/item';
import SettingsPage from './Pages/Admin/Settings/settings';


function App() {
  return (
    <Router>
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<Landing />} />
        <Route path="/products" element={<AllProducts/>} />
        <Route path="/cart" element={<Cart/>}/>
        <Route path="/item" element={<Item/>}/>


        {/* Admin panel */}
        <Route
          path="/admin/*"
          element={
            <div >
                <Routes>
                  {/* Redirect /admin to dashboard */}
                  <Route path="" element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="attributes" element={<AttributesPage />} />
                  <Route path='settings' element={<SettingsPage/>}/>
                </Routes>
              </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
