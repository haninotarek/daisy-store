import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import StoreLayout from './layouts/StoreLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import { ToastHost } from './components/Toast.jsx';
import { useAuth } from './context/AuthContext.jsx';

import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import CartPage from './pages/CartPage.jsx';
import WishlistPage from './pages/WishlistPage.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderConfirmation from './pages/OrderConfirmation.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Account from './pages/Account.jsx';
import Orders from './pages/Orders.jsx';
import Contact from './pages/Contact.jsx';
import PolicyPage from './pages/PolicyPage.jsx';
import NotFound from './pages/NotFound.jsx';

import AdminLogin from './pages/admin/AdminLogin.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import ProductForm from './pages/admin/ProductForm.jsx';
import AdminCategories from './pages/admin/AdminCategories.jsx';
import AdminFields from './pages/admin/AdminFields.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminOrderDetail from './pages/admin/AdminOrderDetail.jsx';
import AdminCustomers from './pages/admin/AdminCustomers.jsx';
import AdminHero from './pages/admin/AdminHero.jsx';
import AdminHomepage from './pages/admin/AdminHomepage.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';
import AdminPolicies from './pages/admin/AdminPolicies.jsx';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user || user.role !== 'ADMIN') return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <ToastHost />
      <Routes>
        {/* Storefront */}
        <Route element={<StoreLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/products/:slug" element={<ProductPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:orderNumber" element={<OrderConfirmation />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
          <Route path="/account/orders" element={<RequireAuth><Orders /></RequireAuth>} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/policy/:key" element={<PolicyPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id" element={<ProductForm />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="fields" element={<AdminFields />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="hero" element={<AdminHero />} />
          <Route path="homepage" element={<AdminHomepage />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="policies" element={<AdminPolicies />} />
        </Route>
      </Routes>
    </>
  );
}
