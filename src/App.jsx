import { useEffect, useState } from "react";

import { Routes, Route, useLocation, Navigate } from "react-router-dom";

import { supabase } from "./lib/supabase";

import "./App.css";

import Home from "./Home";
import Menu from "./Menu";
import About from "./About";
import Gallery from "./Gallery";
import Contact from "./Contact";
import Order from "./Order";
import Login from "./Login";
import Register from "./Register";
import Reservation from "./Reservation";
import MyAccount from "./MyAccount";
import Loading from "./Loading";

// Admin
import Admin from "./Admin";
import AdminLogin from "./AdminLogin";
import AdminOrders from "./AdminOrders";
import AdminMenu from "./AdminMenu";
import AdminGallery from "./AdminGallery";
import AdminReservations from "./AdminReservations";
import Users from "./Users";
import UserDetails from "./UserDetails";
import Settings from "./Settings";
import ResetPassword from "./ResetPassword";

// =========================
// PROTECTED ADMIN ROUTE
// =========================

function ProtectedAdmin({ children }) {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (mounted) {
        setSession(data.session);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Session check होने तक कुछ मत दिखाओ
  if (session === undefined) {
    return <Loading />;
  }

  // Login नहीं है
  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

// =========================
// APP CONTENT
// =========================

function AppContent() {
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(location.pathname === "/");

  useEffect(() => {
    if (location.pathname === "/") {
      setIsLoading(true);

      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 3500);

      return () => clearTimeout(timer);
    }

    setIsLoading(false);
  }, [location.pathname]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Routes>
      {/* ================= PUBLIC PAGES ================= */}

      <Route path="/" element={<Home />} />

      <Route path="/menu" element={<Menu />} />

      <Route path="/about" element={<About />} />

      <Route path="/gallery" element={<Gallery />} />

      <Route path="/contact" element={<Contact />} />

      <Route path="/order" element={<Order />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route path="/reservation" element={<Reservation />} />

      <Route path="/my-account" element={<MyAccount />} />
      <Route path="/admin/reset-password" element={<ResetPassword />} />

      {/* ================= ADMIN LOGIN ================= */}

      <Route path="/admin/login" element={<AdminLogin />} />

      {/* ================= ADMIN DASHBOARD ================= */}

      <Route
        path="/admin"
        element={
          <ProtectedAdmin>
            <Admin />
          </ProtectedAdmin>
        }
      />

      {/* ================= ADMIN ORDERS ================= */}

      <Route
        path="/admin/orders"
        element={
          <ProtectedAdmin>
            <AdminOrders />
          </ProtectedAdmin>
        }
      />

      {/* ================= ADMIN MENU ================= */}

      <Route
        path="/admin/menu"
        element={
          <ProtectedAdmin>
            <AdminMenu />
          </ProtectedAdmin>
        }
      />

      {/* ================= ADMIN GALLERY ================= */}

      <Route
        path="/admin/gallery"
        element={
          <ProtectedAdmin>
            <AdminGallery />
          </ProtectedAdmin>
        }
      />

      {/* ================= ADMIN RESERVATIONS ================= */}

      <Route
        path="/admin/reservations"
        element={
          <ProtectedAdmin>
            <AdminReservations />
          </ProtectedAdmin>
        }
      />

      {/* ================= ADMIN USERS ================= */}

      <Route
        path="/admin/users"
        element={
          <ProtectedAdmin>
            <Users />
          </ProtectedAdmin>
        }
      />

      {/* ================= USER DETAILS ================= */}

      <Route
        path="/admin/users/:id"
        element={
          <ProtectedAdmin>
            <UserDetails />
          </ProtectedAdmin>
        }
      />

      {/* ================= ADMIN SETTINGS ================= */}

      <Route
        path="/admin/settings"
        element={
          <ProtectedAdmin>
            <Settings />
          </ProtectedAdmin>
        }
      />

      {/* ================= LOADING ================= */}

      <Route path="/loading" element={<Loading />} />

      {/* ================= 404 ================= */}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// =========================
// APP
// =========================

function App() {
  return <AppContent />;
}

export default App;
