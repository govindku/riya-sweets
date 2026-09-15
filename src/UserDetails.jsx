import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "./lib/supabase";
import "./UserDetails.css";

function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [id]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Get user from Supabase
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (userError) {
        console.error("User loading error:", userError);
        throw userError;
      }

      if (!userData) {
        setUser(null);
        setOrders([]);
        return;
      }

      const foundUser = {
        id: userData.id,
        name: userData.name,
        phone: userData.phone,
        email: userData.email,
        city: userData.city || "",
        address: userData.address || "",
        pincode: userData.pincode || "",
        createdAt: userData.created_at,
      };

      setUser(foundUser);

      // Get customer's orders from Supabase
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .or(
          `user_id.eq.${foundUser.email},customer_phone.eq.${foundUser.phone}`
        )
        .order("created_at", { ascending: false });

      if (orderError) {
        console.error("Orders loading error:", orderError);
        setOrders([]);
      } else {
        const mappedOrders = (orderData || []).map((order) => ({
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

          razorpayOrderId: order.razorpay_order_id,
          paymentId: order.razorpay_payment_id,

          createdAt: order.created_at,
        }));

        setOrders(mappedOrders);

        // Keep localStorage compatibility
        localStorage.setItem(
          "riyaOrders",
          JSON.stringify(mappedOrders)
        );
      }

      // Keep localStorage compatibility
      const savedUsers = JSON.parse(
        localStorage.getItem("riyaUsers") || "[]"
      );

      const updatedUsers = [
        ...savedUsers.filter((item) => item.id !== foundUser.id),
        foundUser,
      ];

      localStorage.setItem(
        "riyaUsers",
        JSON.stringify(updatedUsers)
      );
    } catch (error) {
      console.error("Failed to load user details:", error);

      // Fallback to localStorage
      const savedUsers = JSON.parse(
        localStorage.getItem("riyaUsers") || "[]"
      );

      const savedOrders = JSON.parse(
        localStorage.getItem("riyaOrders") || "[]"
      );

      const foundUser = savedUsers.find(
        (item) => item.id === id
      );

      setUser(foundUser || null);

      if (foundUser) {
        const userOrders = savedOrders.filter(
          (order) =>
            order.customer?.phone === foundUser.phone ||
            order.customer?.email === foundUser.email ||
            order.userId === foundUser.email
        );

        setOrders(userOrders);
      } else {
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = orders.reduce(
    (total, order) => total + Number(order.total || 0),
    0
  );

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

  const formatDateTime = (date) => {
    if (!date) return "Unknown";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Unknown";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClass = (status) => {
    return (
      status?.toLowerCase().replace(/\s+/g, "-") ||
      "default"
    );
  };

  if (loading && !user) {
    return (
      <div className="user-details-page">
        <div className="user-not-found">
          <h2>Loading User...</h2>
          <p>Please wait while customer details are loading.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-details-page">
        <div className="user-not-found">
          <h2>User Not Found</h2>

          <p>
            This customer does not exist or may have been removed.
          </p>

          <button onClick={() => navigate("/admin/users")}>
            ← Back to Users
          </button>
        </div>
      </div>
    );
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const latestOrder = orders.length ? orders[0] : null;

  return (
    <div className="user-details-page">

      {/* HEADER */}
      <div className="details-header">
        <button
          className="back-button"
          onClick={() => navigate("/admin/users")}
        >
          ← Back
        </button>

        <div>
          <p>RIYA SWEETS</p>
          <h1>User Details</h1>
        </div>

        <button
          className="refresh-button"
          onClick={loadUserData}
          disabled={loading}
        >
          {loading ? "⏳ Loading..." : "🔄 Refresh"}
        </button>
      </div>

      {/* PROFILE */}
      <div className="profile-card">
        <div className="profile-avatar">
          {initials}
        </div>

        <div className="profile-info">
          <h2>{user.name || "Unknown User"}</h2>

          <p>📱 {user.phone || "No phone"}</p>

          <p>✉️ {user.email || "No email"}</p>

          <p>📍 {user.city || "No city"}</p>

          <p>🏠 {user.address || "No address"}</p>

          {user.pincode && (
            <p>📮 {user.pincode}</p>
          )}

          <span className="joined">
            Joined {formatDate(user.createdAt)}
          </span>
        </div>
      </div>

      {/* STATS */}
      <div className="details-stats">

        <div className="details-stat-card">
          <span>📦 Total Orders</span>
          <strong>{orders.length}</strong>
        </div>

        <div className="details-stat-card">
          <span>💰 Total Spent</span>

          <strong>
            ₹{totalSpent.toLocaleString("en-IN")}
          </strong>
        </div>

        <div className="details-stat-card">
          <span>🧾 Average Order</span>

          <strong>
            ₹
            {orders.length
              ? Math.round(
                  totalSpent / orders.length
                ).toLocaleString("en-IN")
              : 0}
          </strong>
        </div>

        <div className="details-stat-card">
          <span>🕐 Latest Order</span>

          <strong>
            {latestOrder
              ? formatDate(latestOrder.createdAt)
              : "No orders"}
          </strong>
        </div>

      </div>

      {/* CUSTOMER INFORMATION */}
      <div className="details-section">
        <div className="section-title">
          <h2>Customer Information</h2>
        </div>

        <div className="customer-grid">

          <div>
            <span>Full Name</span>
            <strong>{user.name || "—"}</strong>
          </div>

          <div>
            <span>Phone</span>
            <strong>{user.phone || "—"}</strong>
          </div>

          <div>
            <span>Email</span>
            <strong>{user.email || "—"}</strong>
          </div>

          <div>
            <span>City</span>
            <strong>{user.city || "—"}</strong>
          </div>

          <div>
            <span>Pincode</span>
            <strong>{user.pincode || "—"}</strong>
          </div>

          <div className="full-width">
            <span>Address</span>
            <strong>{user.address || "—"}</strong>
          </div>

        </div>
      </div>

      {/* ORDER HISTORY */}
      <div className="details-section">

        <div className="section-title">
          <div>
            <h2>Order History</h2>
            <p>{orders.length} total orders</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="no-orders">
            <h3>No Orders Found</h3>

            <p>
              This customer has not placed any orders yet.
            </p>
          </div>
        ) : (
          <div className="orders-list">

            {orders.map((order) => (
              <div
                className="order-history-card"
                key={order.orderId}
              >

                {/* ORDER MAIN */}
                <div className="order-main">

                  <div className="order-id">
                    <span>Order ID</span>
                    <strong>{order.orderId}</strong>
                  </div>

                  <div className="order-date">
                    <span>Date</span>

                    <strong>
                      {formatDateTime(order.createdAt)}
                    </strong>
                  </div>

                </div>

                {/* ITEMS */}
                <div className="order-items">

                  {order.items?.map((item, index) => (
                    <div
                      className="order-item"
                      key={`${order.orderId}-${index}`}
                    >
                      <span>
                        {item.name} × {item.quantity}
                      </span>

                      <strong>
                        ₹
                        {(
                          Number(item.price || 0) *
                          Number(item.quantity || 0)
                        ).toLocaleString("en-IN")}
                      </strong>
                    </div>
                  ))}

                </div>

                {/* FOOTER */}
                <div className="order-footer">

                  <div>
                    <span>Payment</span>
                    <strong>
                      {order.paymentMethod || "Unknown"}
                    </strong>
                  </div>

                  <div>
                    <span>Status</span>

                    <strong
                      className={`status ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {order.status || "Order Placed"}
                    </strong>
                  </div>

                  <div>
                    <span>Total</span>

                    <strong className="order-total">
                      ₹
                      {Number(
                        order.total || 0
                      ).toLocaleString("en-IN")}
                    </strong>
                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}

export default UserDetails;
