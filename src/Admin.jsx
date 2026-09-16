import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import "./Admin.css";

function Admin() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [menu, setMenu] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // MAP SUPABASE ORDER
  // =====================================================

  const mapOrder = (order) => ({
    id: order.id,
    orderId: order.order_id,
    userId: order.user_id,

    customer: {
      name: order.customer_name || "",
      phone: order.customer_phone || "",
      email: order.customer_email || "",
      address: order.address || "",
      city: order.city || "",
      pincode: order.pincode || "",
    },

    items: Array.isArray(order.items)
      ? order.items
      : [],

    subtotal: Number(order.subtotal || 0),

    deliveryCharge:
      order.delivery_charge !== null &&
      order.delivery_charge !== undefined
        ? Number(order.delivery_charge)
        : null,

    total: Number(order.total_amount || 0),

    paymentMethod:
      order.payment_method || "Online Payment",

    paymentStatus:
      order.payment_status || "Pending",

    paymentId:
      order.razorpay_payment_id || "",

    razorpayOrderId:
      order.razorpay_order_id || "",

    status:
      order.order_status || "Order Placed",

    createdAt:
      order.created_at || null,
  });

  // =====================================================
  // LOAD ORDERS
  // =====================================================

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Orders loading error:",
          error
        );
        return;
      }

      const mappedOrders =
        (data || []).map(mapOrder);

      setOrders(mappedOrders);

      localStorage.setItem(
        "riyaOrders",
        JSON.stringify(mappedOrders)
      );
    } catch (error) {
      console.error(
        "Orders error:",
        error
      );
    }
  };

  // =====================================================
  // LOAD USERS
  // =====================================================

  const loadUsers = () => {
    const savedUsers = JSON.parse(
      localStorage.getItem("riyaUsers") || "[]"
    );

    setUsers(savedUsers);
  };

  // =====================================================
  // LOAD MENU
  // =====================================================

  const loadMenu = async () => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Menu loading error:",
          error
        );

        const savedMenu = JSON.parse(
          localStorage.getItem(
            "riyaMenu"
          ) || "[]"
        );

        setMenu(savedMenu);
        return;
      }

      const mappedMenu =
        (data || []).map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: Number(item.price || 0),
          image: item.image_url || "",
          description:
            item.description || "",
          tag: item.tag || "",
          available:
            item.available !== false,
          popular:
            item.is_popular === true,
        }));

      setMenu(mappedMenu);

      localStorage.setItem(
        "riyaMenu",
        JSON.stringify(mappedMenu)
      );
    } catch (error) {
      console.error(
        "Menu error:",
        error
      );
    }
  };

  // =====================================================
  // LOAD RESERVATIONS
  // =====================================================

  const loadReservations = async () => {
    try {
      const { data, error } =
        await supabase
          .from("reservations")
          .select("*")
          .order("created_at", {
            ascending: false,
          });

      if (error) {
        console.error(
          "Reservations loading error:",
          error
        );

        const savedReservations =
          JSON.parse(
            localStorage.getItem(
              "riyaReservations"
            ) || "[]"
          );

        setReservations(
          savedReservations
        );

        return;
      }

      const mappedReservations =
        (data || []).map(
          (reservation) => ({
            id: reservation.id,

            bookingId:
              reservation.booking_id,

            userId:
              reservation.user_id,

            customer: {
              name:
                reservation.customer_name ||
                "",

              phone:
                reservation.customer_phone ||
                "",

              email:
                reservation.customer_email ||
                "",
            },

            date:
              reservation.reservation_date,

            time:
              reservation.reservation_time,

            guests:
              reservation.guests || 2,

            table:
              reservation.table_preference ||
              "Indoor",

            request:
              reservation.special_request ||
              "",

            status:
              reservation.status ||
              "Pending",

            createdAt:
              reservation.created_at,
          })
        );

      setReservations(
        mappedReservations
      );

      localStorage.setItem(
        "riyaReservations",
        JSON.stringify(
          mappedReservations
        )
      );
    } catch (error) {
      console.error(
        "Reservations error:",
        error
      );
    }
  };

  // =====================================================
  // LOAD ALL DATA
  // =====================================================

  const loadData = async () => {
    try {
      setLoading(true);

      await Promise.all([
        loadOrders(),
        loadMenu(),
        loadReservations(),
      ]);

      loadUsers();
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD + AUTO REFRESH
  // =====================================================

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener(
      "storage",
      handleUpdate
    );

    window.addEventListener(
      "riyaOrderUpdated",
      handleUpdate
    );

    window.addEventListener(
      "riyaReservationUpdated",
      handleUpdate
    );

    window.addEventListener(
      "riyaMenuUpdated",
      handleUpdate
    );

    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => {
      window.removeEventListener(
        "storage",
        handleUpdate
      );

      window.removeEventListener(
        "riyaOrderUpdated",
        handleUpdate
      );

      window.removeEventListener(
        "riyaReservationUpdated",
        handleUpdate
      );

      window.removeEventListener(
        "riyaMenuUpdated",
        handleUpdate
      );

      clearInterval(interval);
    };
  }, []);

  // =====================================================
  // TOTAL REVENUE
  // =====================================================

  const totalRevenue =
    orders.reduce(
      (total, order) =>
        total +
        Number(order.total || 0),
      0
    );

  // =====================================================
  // PENDING ORDERS
  // =====================================================

  const pendingOrders =
    orders.filter(
      (order) =>
        order.status ===
          "Order Placed" ||
        order.status ===
          "Confirmed" ||
        order.status ===
          "Preparing"
    ).length;

  // =====================================================
  // AVAILABLE MENU ITEMS
  // =====================================================

  const availableMenu =
    menu.filter(
      (item) =>
        item.available !== false
    ).length;

  // =====================================================
  // RESERVATION STATS
  // =====================================================

  const pendingReservations =
    reservations.filter(
      (reservation) =>
        reservation.status ===
        "Pending"
    ).length;

  const confirmedReservations =
    reservations.filter(
      (reservation) =>
        reservation.status ===
        "Confirmed"
    ).length;

  const completedReservations =
    reservations.filter(
      (reservation) =>
        reservation.status ===
        "Completed"
    ).length;

  // =====================================================
  // RECENT ORDERS
  // =====================================================

  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(
          b.createdAt || 0
        ) -
        new Date(
          a.createdAt || 0
        )
    )
    .slice(0, 5);

  // =====================================================
  // FORMAT CURRENCY
  // =====================================================

  const formatCurrency = (amount) => {
    return Number(
      amount || 0
    ).toLocaleString("en-IN");
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "Unknown";

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "Unknown";
    }

    return parsedDate.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass = (status) => {
    return (
      status
        ?.toLowerCase()
        .replace(/\s+/g, "-") ||
      "order-placed"
    );
  };

  return (
    <div className="admin-layout">

      {/* SIDEBAR */}

      <aside className="admin-sidebar">

        <div className="admin-logo">
          <span>RIYA</span>

          <small>
            RESTAURANT ADMIN
          </small>
        </div>

        <nav className="admin-nav">

          {/* Dashboard */}

          <button
            className="active"
            onClick={() =>
              navigate("/admin")
            }
          >
            📊 Dashboard
          </button>

          {/* Orders */}

          <button
            onClick={() =>
              navigate(
                "/admin/orders"
              )
            }
          >
            🛒 Orders

            {orders.length > 0 && (
              <span className="nav-badge">
                {orders.length}
              </span>
            )}
          </button>

          {/* Users */}

          <button
            onClick={() =>
              navigate(
                "/admin/users"
              )
            }
          >
            👥 Users

            {users.length > 0 && (
              <span className="nav-badge">
                {users.length}
              </span>
            )}
          </button>

          {/* Reservations */}

          <button
            onClick={() =>
              navigate(
                "/admin/reservations"
              )
            }
            className="admin-sidebar-link"
          >
            <span>📅</span>

            <span>
              Reservations
            </span>

            {pendingReservations >
              0 && (
              <span className="nav-badge">
                {
                  pendingReservations
                }
              </span>
            )}
          </button>

          {/* Menu */}

          <button
            onClick={() =>
              navigate(
                "/admin/menu"
              )
            }
          >
            🍔 Menu
          </button>

          {/* Gallery */}

          <button
            onClick={() =>
              navigate(
                "/admin/gallery"
              )
            }
          >
            🖼️ Gallery
          </button>

          {/* Settings */}

          <button
            onClick={() =>
              navigate(
                "/admin/settings"
              )
            }
          >
            ⚙️ Settings
          </button>

          {/* Logout */}

          <button
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem(
                "riyaAdminLoggedIn"
              );

              navigate(
                "/admin/login"
              );
            }}
          >
            🚪 Logout
          </button>

        </nav>

        <div className="admin-sidebar-bottom">
          <span>
            RIYA SWEETS
          </span>

          <small>
            Admin Panel
          </small>
        </div>

      </aside>

      {/* MAIN */}

      <main className="admin-main">

        {/* TOPBAR */}

        <div className="admin-topbar">

          <div>
            <p>DASHBOARD</p>

            <h1>
              Welcome back 👋
            </h1>
          </div>

          <button
            className="refresh-btn"
            onClick={loadData}
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : "↻ Refresh"}
          </button>

        </div>

        {/* STATS */}

        <div className="dashboard-stats">

          {/* Orders */}

          <div
            className="dashboard-card clickable"
            onClick={() =>
              navigate(
                "/admin/orders"
              )
            }
          >
            <span>
              🛒 Total Orders
            </span>

            <strong>
              {orders.length}
            </strong>

            <small>
              View all orders →
            </small>
          </div>

          {/* Users */}

          <div
            className="dashboard-card clickable"
            onClick={() =>
              navigate(
                "/admin/users"
              )
            }
          >
            <span>
              👥 Total Users
            </span>

            <strong>
              {users.length}
            </strong>

            <small>
              View customers →
            </small>
          </div>

          {/* Revenue */}

          <div className="dashboard-card">

            <span>
              💰 Total Revenue
            </span>

            <strong>
              ₹
              {formatCurrency(
                totalRevenue
              )}
            </strong>

            <small>
              From all orders
            </small>

          </div>

          {/* Pending Orders */}

          <div
            className="dashboard-card clickable"
            onClick={() =>
              navigate(
                "/admin/orders"
              )
            }
          >
            <span>
              ⏳ Pending Orders
            </span>

            <strong>
              {pendingOrders}
            </strong>

            <small>
              Need attention →
            </small>
          </div>

          {/* Reservations */}

          <div
            className="dashboard-card clickable"
            onClick={() =>
              navigate(
                "/admin/reservations"
              )
            }
          >
            <span>
              📅 Reservations
            </span>

            <strong>
              {reservations.length}
            </strong>

            <small>
              {pendingReservations > 0
                ? `${pendingReservations} pending request${
                    pendingReservations >
                    1
                      ? "s"
                      : ""
                  } →`
                : "View reservations →"}
            </small>

          </div>

        </div>

        {/* QUICK INFO */}

        <div className="dashboard-extra">

          {/* Menu */}

          <div className="extra-card">
            <span>
              🍔 Menu Items
            </span>

            <strong>
              {menu.length}
            </strong>

            <small>
              {availableMenu} currently
              available
            </small>
          </div>

          {/* Delivered */}

          <div className="extra-card">

            <span>
              📦 Delivered Orders
            </span>

            <strong>
              {
                orders.filter(
                  (order) =>
                    order.status ===
                    "Delivered"
                ).length
              }
            </strong>

            <small>
              Successfully completed
            </small>

          </div>

          {/* Cancelled */}

          <div className="extra-card">

            <span>
              ❌ Cancelled Orders
            </span>

            <strong>
              {
                orders.filter(
                  (order) =>
                    order.status ===
                    "Cancelled"
                ).length
              }
            </strong>

            <small>
              Cancelled orders
            </small>

          </div>

          {/* Pending Reservations */}

          <div
            className="extra-card clickable"
            onClick={() =>
              navigate(
                "/admin/reservations"
              )
            }
          >
            <span>
              📅 Pending Reservations
            </span>

            <strong>
              {pendingReservations}
            </strong>

            <small>
              {confirmedReservations}{" "}
              confirmed •{" "}
              {completedReservations}{" "}
              completed
            </small>
          </div>

        </div>

        {/* RECENT ORDERS */}

        <section className="recent-orders">

          <div className="section-header">

            <div>
              <p>ORDERS</p>

              <h2>
                Recent Orders
              </h2>
            </div>

            <button
              onClick={() =>
                navigate(
                  "/admin/orders"
                )
              }
            >
              View All →
            </button>

          </div>

          {recentOrders.length ===
          0 ? (
            <div className="empty-dashboard">

              <div className="empty-icon">
                📦
              </div>

              <h3>
                No Orders Yet
              </h3>

              <p>
                New customer orders
                will appear here.
              </p>

            </div>
          ) : (
            <div className="recent-list">

              {recentOrders.map(
                (order) => (

                  <div
                    className="recent-order"
                    key={
                      order.orderId
                    }
                    onClick={() =>
                      navigate(
                        "/admin/orders"
                      )
                    }
                  >

                    {/* Order ID */}

                    <div className="order-id-box">

                      <span>
                        ORDER ID
                      </span>

                      <h3>
                        {
                          order.orderId
                        }
                      </h3>

                      <small>
                        {formatDate(
                          order.createdAt
                        )}
                      </small>

                    </div>

                    {/* Customer */}

                    <div>

                      <span>
                        CUSTOMER
                      </span>

                      <p>
                        {order.customer
                          ?.name ||
                          "N/A"}
                      </p>

                      <small>
                        {order.customer
                          ?.phone ||
                          ""}
                      </small>

                    </div>

                    {/* Amount */}

                    <div>

                      <span>
                        AMOUNT
                      </span>

                      <p>
                        ₹
                        {formatCurrency(
                          order.total
                        )}
                      </p>

                    </div>

                    {/* Status */}

                    <div>

                      <span>
                        STATUS
                      </span>

                      <p
                        className={`order-status ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {order.status ||
                          "Order Placed"}
                      </p>

                    </div>

                    {/* Arrow */}

                    <div className="recent-arrow">
                      →
                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </section>

      </main>
    </div>
  );
}

export default Admin;