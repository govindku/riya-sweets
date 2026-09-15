import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import "./Users.css";

function Users() {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Load users and orders from Supabase
  const loadData = async () => {
    try {
      setLoading(true);

      const [usersResult, ordersResult] = await Promise.all([
        supabase
          .from("users")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (usersResult.error) {
        console.error("Users loading error:", usersResult.error);
      }

      if (ordersResult.error) {
        console.error("Orders loading error:", ordersResult.error);
      }

      const supabaseUsers = (usersResult.data || []).map((user) => ({
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        city: user.city,
        address: user.address,
        createdAt: user.created_at,
      }));

      const supabaseOrders = (ordersResult.data || []).map((order) => ({
        id: order.id,
        orderId: order.order_id,
        userId: order.user_id,
        customer: {
          name: order.customer_name,
          phone: order.customer_phone,
          email: order.customer_email,
          address: order.address,
          city: order.city,
          pincode: order.pincode,
        },
        items: order.items || [],
        subtotal: Number(order.subtotal || 0),
        deliveryCharge: Number(order.delivery_charge || 0),
        total: Number(order.total_amount || 0),
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        status: order.order_status,
        createdAt: order.created_at,
      }));

      setUsers(supabaseUsers);
      setOrders(supabaseOrders);

      // Keep localStorage compatibility
      localStorage.setItem("riyaUsers", JSON.stringify(supabaseUsers));
      localStorage.setItem("riyaOrders", JSON.stringify(supabaseOrders));
    } catch (error) {
      console.error("Failed to load users:", error);

      // Fallback to localStorage
      const savedUsers = JSON.parse(
        localStorage.getItem("riyaUsers") || "[]"
      );

      const savedOrders = JSON.parse(
        localStorage.getItem("riyaOrders") || "[]"
      );

      setUsers(savedUsers);
      setOrders(savedOrders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener("storage", handleUpdate);
    window.addEventListener("riyaOrderUpdated", handleUpdate);
    window.addEventListener("riyaUserUpdated", handleUpdate);

    // Auto refresh every 5 seconds
    const interval = setInterval(loadData, 5000);

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("riyaOrderUpdated", handleUpdate);
      window.removeEventListener("riyaUserUpdated", handleUpdate);
      clearInterval(interval);
    };
  }, []);

  // Get orders of a specific user
  const getUserOrders = (user) => {
    return orders.filter((order) => {
      const orderPhone = order.customer?.phone;
      const orderEmail = order.customer?.email || order.userId;

      return (
        (user.phone && orderPhone === user.phone) ||
        (user.email && orderEmail === user.email)
      );
    });
  };

  // Calculate total spent
  const getTotalSpent = (user) => {
    const userOrders = getUserOrders(user);

    return userOrders.reduce(
      (total, order) => total + Number(order.total || 0),
      0
    );
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "Unknown";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Unknown";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Search users
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) => {
      return (
        user.name?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.city?.toLowerCase().includes(query)
      );
    });
  }, [users, search]);

  // New users in last 30 days
  const newUsers = users.filter((user) => {
    if (!user.createdAt) return false;

    const createdAt = new Date(user.createdAt);
    const now = new Date();

    const difference = now.getTime() - createdAt.getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    return difference >= 0 && difference <= thirtyDays;
  });

  // Total spent by all users
  const totalSpent = users.reduce(
    (total, user) => total + getTotalSpent(user),
    0
  );

  return (
    <div className="users-page">
      {/* HEADER */}
      <div className="users-header">
        <div>
          <p>RIYA SWEETS</p>
          <h1>Users</h1>
        </div>

        <button onClick={loadData} disabled={loading}>
          {loading ? "⏳ Loading..." : "🔄 Refresh"}
        </button>
      </div>

      {/* STATS */}
      <div className="users-dashboard">
        <div className="user-dashboard-card">
          <span>👥 Total Users</span>
          <strong>{users.length}</strong>
          <small>All registered customers</small>
        </div>

        <div className="user-dashboard-card">
          <span>🆕 New Users</span>
          <strong>{newUsers.length}</strong>
          <small>Joined in last 30 days</small>
        </div>

        <div className="user-dashboard-card">
          <span>📦 Total Orders</span>
          <strong>{orders.length}</strong>
          <small>All customer orders</small>
        </div>

        <div className="user-dashboard-card">
          <span>💰 Total Revenue</span>
          <strong>₹{totalSpent.toLocaleString("en-IN")}</strong>
          <small>From all customers</small>
        </div>
      </div>

      {/* SEARCH */}
      <div className="users-toolbar">
        <div className="users-count">
          <span>Customers</span>
          <strong>{filteredUsers.length}</strong>
        </div>

        <input
          type="text"
          placeholder="Search name, phone, email or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* USERS LIST */}
      <div className="users-list">
        {loading && users.length === 0 ? (
          <div className="no-users">
            <h2>Loading Users...</h2>
            <p>Please wait while customer data is loading.</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="no-users">
            <h2>{search ? "No Matching Users" : "No Users Found"}</h2>

            <p>
              {search
                ? "Try searching with another name, phone or email."
                : "Customers will appear here after registration."}
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const userOrders = getUserOrders(user);
            const userTotalSpent = getTotalSpent(user);

            const initials = user.name
              ? user.name
                  .split(" ")
                  .map((word) => word.charAt(0))
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              : "U";

            return (
              <div
                className="user-card"
                key={user.id}
                onClick={() => navigate(`/admin/users/${user.id}`)}
              >
                {/* AVATAR */}
                <div className="user-avatar">{initials}</div>

                {/* USER INFO */}
                <div className="user-info">
                  <h2>{user.name || "Unknown User"}</h2>

                  <p>📱 {user.phone || "No phone"}</p>

                  <p>✉️ {user.email || "No email"}</p>

                  <p>📍 {user.city || "No city"}</p>

                  <p className="joined-date">
                    📅 Joined: {formatDate(user.createdAt)}
                  </p>
                </div>

                {/* USER STATS */}
                <div className="user-stats">
                  <div>
                    <span>Orders</span>
                    <strong>{userOrders.length}</strong>
                  </div>

                  <div>
                    <span>Total Spent</span>
                    <strong>
                      ₹{userTotalSpent.toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>

                {/* ARROW */}
                <div className="user-arrow">→</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Users;
