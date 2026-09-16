import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import "./MyAccount.css";
import { supabase } from "./lib/supabase";

function MyAccount() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [activeTab, setActiveTab] = useState("orders");
  const [loggedInUser, setLoggedInUser] = useState(null);

  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(true);

  // Prevent duplicate requests
  const ordersLoadingRef = useRef(false);
  const reservationsLoadingRef = useRef(false);
  const mountedRef = useRef(true);

  // =====================================================
  // GET LOGGED-IN USER
  // =====================================================

  const getLoggedInUser = () => {
    try {
      return JSON.parse(
        localStorage.getItem("riyaLoggedInUser") || "null"
      );
    } catch (error) {
      console.error("Logged-in user parse error:", error);
      return null;
    }
  };

  // =====================================================
  // MAP SUPABASE ORDER
  // =====================================================

  const mapSupabaseOrder = (order) => {
    return {
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

      items: Array.isArray(order.items) ? order.items : [],

      subtotal: Number(order.subtotal || 0),

      deliveryCharge:
        order.delivery_charge !== null &&
        order.delivery_charge !== undefined
          ? Number(order.delivery_charge)
          : 0,

      total:
        order.total_amount !== null &&
        order.total_amount !== undefined
          ? Number(order.total_amount)
          : 0,

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
        order.created_at || new Date().toISOString(),
    };
  };

  // =====================================================
  // LOAD ORDERS
  // =====================================================

  const loadOrders = async (
  user = loggedInUser,
  showLoading = false
) => {
  if (!user?.email) {
    if (mountedRef.current) {
      setOrders([]);
      setLoadingOrders(false);
    }
    return;
  }

  if (ordersLoadingRef.current) {
    return;
  }

  ordersLoadingRef.current = true;

  if (showLoading && mountedRef.current) {
    setLoadingOrders(true);
  }

  try {
    // IMPORTANT:
    // Order.jsx में email जिस तरह save हुआ है,
    // उसी exact email से search करेंगे.
    const userEmail = String(user.email).trim();

    console.log("🔎 My Account exact email:", userEmail);

    // 1️⃣ user_id से exact match
    const { data: userIdOrders, error: userIdError } =
      await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userEmail)
        .order("created_at", {
          ascending: false,
        });

    console.log("📌 user_id orders:", userIdOrders);
    console.log("❌ user_id error:", userIdError);

    // 2️⃣ customer_email से exact match
    const { data: customerEmailOrders, error: customerEmailError } =
      await supabase
        .from("orders")
        .select("*")
        .eq("customer_email", userEmail)
        .order("created_at", {
          ascending: false,
        });

    console.log("📌 customer_email orders:", customerEmailOrders);
    console.log(
      "❌ customer_email error:",
      customerEmailError
    );

    const allOrders = [
      ...(userIdOrders || []),
      ...(customerEmailOrders || []),
    ];

    // Duplicate हटाओ
    const uniqueOrders = Array.from(
      new Map(
        allOrders.map((order) => [
          order.id,
          order,
        ])
      ).values()
    );

    uniqueOrders.sort(
      (a, b) =>
        new Date(b.created_at) -
        new Date(a.created_at)
    );

    console.log(
      "📦 FINAL My Account orders:",
      uniqueOrders
    );

    const formattedOrders = uniqueOrders.map(
      mapSupabaseOrder
    );

    if (!mountedRef.current) return;

    setOrders(formattedOrders);

    localStorage.setItem(
      "riyaOrders",
      JSON.stringify(formattedOrders)
    );
  } catch (error) {
    console.error(
      "❌ My Account order loading error:",
      error
    );
  } finally {
    ordersLoadingRef.current = false;

    if (showLoading && mountedRef.current) {
      setLoadingOrders(false);
    }
  }
};

  // =====================================================
  // LOAD RESERVATIONS
  // =====================================================

  const loadReservations = async (
    user = loggedInUser,
    showLoading = false
  ) => {
    if (!user?.email) {
      if (mountedRef.current) {
        setReservations([]);
        setLoadingReservations(false);
      }
      return;
    }

    if (reservationsLoadingRef.current) {
      return;
    }

    reservationsLoadingRef.current = true;

    if (showLoading && mountedRef.current) {
      setLoadingReservations(true);
    }

    try {
      const userEmail = user.email
        .trim()
        .toLowerCase();

      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("user_id", userEmail)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "My Account reservation load error:",
          error
        );

        return;
      }

      const formattedReservations = (data || []).map(
        (reservation) => ({
          id: reservation.id,

          bookingId:
            reservation.booking_id,

          userId:
            reservation.user_id,

          customer: {
            name:
              reservation.customer_name || "",
            phone:
              reservation.customer_phone || "",
            email:
              reservation.customer_email || "",
          },

          date:
            reservation.reservation_date,

          time:
            reservation.reservation_time,

          guests:
            reservation.guests,

          table:
            reservation.table_preference,

          request:
            reservation.special_request || "",

          status:
            reservation.status || "Pending",

          createdAt:
            reservation.created_at,
        })
      );

      if (!mountedRef.current) return;

      setReservations(formattedReservations);
    } catch (error) {
      console.error(
        "My Account reservation error:",
        error
      );
    } finally {
      reservationsLoadingRef.current = false;

      if (
        showLoading &&
        mountedRef.current
      ) {
        setLoadingReservations(false);
      }
    }
  };

  // =====================================================
  // LOAD ALL DATA
  // =====================================================

  const loadData = async (showLoading = false) => {
    const user = getLoggedInUser();

    if (!user) {
      if (mountedRef.current) {
        setLoggedInUser(null);
        setOrders([]);
        setReservations([]);
        setLoadingOrders(false);
        setLoadingReservations(false);
      }

      return;
    }

    if (mountedRef.current) {
      setLoggedInUser(user);
    }

    await Promise.all([
      loadOrders(user, showLoading),
      loadReservations(user, showLoading),
    ]);
  };

  // =====================================================
  // INITIAL LOAD + SILENT BACKGROUND REFRESH
  // =====================================================

  useEffect(() => {
    mountedRef.current = true;

    // First load
    loadData(true);

    // When another component updates an order
    const handleOrderUpdate = () => {
      const user = getLoggedInUser();

      if (!user) {
        setLoggedInUser(null);
        setOrders([]);
        return;
      }

      setLoggedInUser(user);

      // IMPORTANT:
      // Background refresh only.
      // Loading screen nahi dikhega.
      loadOrders(user, false);
    };

    // Reservation update
    const handleReservationUpdate = () => {
      const user = getLoggedInUser();

      if (!user) {
        setLoggedInUser(null);
        setReservations([]);
        return;
      }

      setLoggedInUser(user);

      loadReservations(user, false);
    };

    const handleStorage = () => {
      const user = getLoggedInUser();

      if (!user) {
        setLoggedInUser(null);
        setOrders([]);
        setReservations([]);
        return;
      }

      setLoggedInUser(user);

      loadOrders(user, false);
      loadReservations(user, false);
    };

    window.addEventListener(
      "riyaOrderUpdated",
      handleOrderUpdate
    );

    window.addEventListener(
      "riyaReservationUpdated",
      handleReservationUpdate
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    // Silent background refresh every 10 seconds
    const liveRefresh = setInterval(() => {
      const user = getLoggedInUser();

      if (!user) return;

      loadOrders(user, false);
      loadReservations(user, false);
    }, 10000);

    return () => {
      mountedRef.current = false;

      window.removeEventListener(
        "riyaOrderUpdated",
        handleOrderUpdate
      );

      window.removeEventListener(
        "riyaReservationUpdated",
        handleReservationUpdate
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );

      clearInterval(liveRefresh);
    };
  }, []);

  // =====================================================
  // CANCEL ORDER
  // =====================================================

  const cancelOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) return;

    try {
      const userEmail =
        loggedInUser?.email?.trim();

      if (!userEmail) return;

      const { data: order, error: findError } =
        await supabase
          .from("orders")
          .select(
            "id, order_id, user_id, order_status"
          )
          .eq("order_id", orderId)
          .eq("user_id", userEmail)
          .single();

      if (findError || !order) {
        console.error(
          "Order not found:",
          findError
        );

        alert(
          "This order could not be found."
        );

        return;
      }

      if (
        order.order_status === "Delivered" ||
        order.order_status === "Cancelled"
      ) {
        alert(
          "This order can no longer be cancelled."
        );

        return;
      }

      const { error: updateError } =
        await supabase
          .from("orders")
          .update({
            order_status: "Cancelled",
          })
          .eq("id", order.id)
          .eq("user_id", userEmail);

      if (updateError) {
        console.error(
          "Order cancel error:",
          updateError
        );

        alert(
          "Order could not be cancelled. Please try again."
        );

        return;
      }

      await loadOrders(
        loggedInUser,
        false
      );

      window.dispatchEvent(
        new Event("riyaOrderUpdated")
      );

      alert(
        "Order cancelled successfully."
      );
    } catch (error) {
      console.error(
        "Cancel order error:",
        error
      );

      alert(
        "Something went wrong. Please try again."
      );
    }
  };

  // =====================================================
  // CANCEL RESERVATION
  // =====================================================

  const cancelReservation = async (
    bookingId
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this table reservation?"
    );

    if (!confirmed) return;

    try {
      const userEmail =
        loggedInUser?.email
          ?.trim()
          .toLowerCase();

      if (!userEmail) return;

      const {
        data: booking,
        error: findError,
      } = await supabase
        .from("reservations")
        .select(
          "id, booking_id, user_id, status"
        )
        .eq("booking_id", bookingId)
        .eq("user_id", userEmail)
        .single();

      if (findError || !booking) {
        console.error(
          "Reservation not found:",
          findError
        );

        alert(
          "This booking could not be found."
        );

        return;
      }

      if (
        booking.status === "Completed" ||
        booking.status === "Cancelled"
      ) {
        alert(
          "This booking can no longer be cancelled."
        );

        return;
      }

      const { error: updateError } =
        await supabase
          .from("reservations")
          .update({
            status: "Cancelled",
          })
          .eq("id", booking.id)
          .eq("user_id", userEmail);

      if (updateError) {
        console.error(
          "Reservation cancel error:",
          updateError
        );

        alert(
          "Booking could not be cancelled. Please try again."
        );

        return;
      }

      await loadReservations(
        loggedInUser,
        false
      );

      window.dispatchEvent(
        new Event("riyaReservationUpdated")
      );
    } catch (error) {
      console.error(
        "Cancel reservation error:",
        error
      );

      alert(
        "Something went wrong. Please try again."
      );
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (time) => {
    if (!time) return "—";

    const [hours, minutes] =
      time.split(":");

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =====================================================
  // ORDER STATUS CLASS
  // =====================================================

  const getOrderStatusClass = (
    status
  ) => {
    switch (status) {
      case "Confirmed":
        return "account-status confirmed";

      case "Preparing":
        return "account-status preparing";

      case "Ready":
        return "account-status ready";

      case "Delivered":
        return "account-status delivered";

      case "Cancelled":
        return "account-status cancelled";

      default:
        return "account-status pending";
    }
  };

  // =====================================================
  // RESERVATION STATUS CLASS
  // =====================================================

  const getReservationStatusClass = (
    status
  ) => {
    switch (status) {
      case "Confirmed":
        return "account-status confirmed";

      case "Completed":
        return "account-status completed";

      case "Cancelled":
        return "account-status cancelled";

      default:
        return "account-status pending";
    }
  };

  // =====================================================
  // SORT ORDERS
  // =====================================================

  const activeOrders = useMemo(() => {
    return [...orders];
  }, [orders]);

  // =====================================================
  // SORT RESERVATIONS
  // =====================================================

  const activeReservations = useMemo(() => {
    return reservations;
  }, [reservations]);

  // =====================================================
  // NOT LOGGED IN
  // =====================================================

  if (!loggedInUser) {
    return (
      <>
        <Navbar />

        <main className="my-account-page">
          <section className="account-empty">
            <div className="empty-account-icon">
              🔐
            </div>

            <h3>Please Login</h3>

            <p>
              Login to view your orders and
              table bookings.
            </p>

            <button
              className="account-primary-button"
              onClick={() =>
                navigate("/login")
              }
            >
              Login →
            </button>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="my-account-page">

        {/* HERO */}

        <section className="account-hero">
          <p className="account-label">
            RIYA SWEETS
          </p>

          <h1>My Account</h1>

          <p>
            Welcome,{" "}
            <strong>
              {loggedInUser.name ||
                "Customer"}
            </strong>
            . Track your orders and manage
            your table reservations from one
            place.
          </p>
        </section>

        {/* PROFILE */}

        <section className="account-profile">
          <div className="profile-avatar">
            {(
              loggedInUser.name || "G"
            )
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="profile-info">
            <span>
              WELCOME BACK
            </span>

            <h2>
              {loggedInUser.name ||
                "Customer"}
            </h2>

            <p>
              {loggedInUser.email}
            </p>

            {loggedInUser.phone && (
              <p>
                ☎ {loggedInUser.phone}
              </p>
            )}
          </div>

          <div className="profile-stats">
            <div>
              <strong>
                {orders.length}
              </strong>

              <span>Orders</span>
            </div>

            <div>
              <strong>
                {reservations.length}
              </strong>

              <span>Bookings</span>
            </div>
          </div>
        </section>

        {/* TABS */}

        <section className="account-tabs">

          <button
            className={
              activeTab === "orders"
                ? "account-tab active"
                : "account-tab"
            }
            onClick={() =>
              setActiveTab("orders")
            }
          >
            <span>🛒</span>

            <div>
              <strong>
                My Orders
              </strong>

              <small>
                {orders.length}{" "}
                {orders.length === 1
                  ? "order"
                  : "orders"}
              </small>
            </div>
          </button>

          <button
            className={
              activeTab === "reservations"
                ? "account-tab active"
                : "account-tab"
            }
            onClick={() =>
              setActiveTab("reservations")
            }
          >
            <span>📅</span>

            <div>
              <strong>
                My Table Bookings
              </strong>

              <small>
                {reservations.length}{" "}
                {reservations.length === 1
                  ? "booking"
                  : "bookings"}
              </small>
            </div>
          </button>

        </section>

        {/* ORDERS */}

        {activeTab === "orders" && (
          <section className="account-content">

            <div className="content-heading">
              <div>
                <p className="content-label">
                  ORDER HISTORY
                </p>

                <h2>My Orders</h2>
              </div>

              <button
                className="account-action-button"
                onClick={() =>
                  navigate("/menu")
                }
              >
                Order Food →
              </button>
            </div>

            {loadingOrders &&
            activeOrders.length === 0 ? (
              <div className="account-empty">
                <div className="empty-account-icon">
                  ⏳
                </div>

                <h3>
                  Loading orders...
                </h3>

                <p>
                  Please wait while we load
                  your orders.
                </p>
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="account-empty">
                <div className="empty-account-icon">
                  🛒
                </div>

                <h3>
                  No orders yet
                </h3>

                <p>
                  Your food orders will appear
                  here after you place an order.
                </p>

                <button
                  className="account-primary-button"
                  onClick={() =>
                    navigate("/menu")
                  }
                >
                  Explore Menu
                </button>
              </div>
            ) : (
              <div className="account-list">

                {activeOrders.map(
                  (order) => (
                    <article
                      className="account-card"
                      key={order.orderId}
                    >

                      {/* HEADER */}

                      <div className="account-card-header">
                        <div>
                          <span className="account-card-label">
                            ORDER ID
                          </span>

                          <strong className="account-id">
                            {order.orderId}
                          </strong>

                          <p>
                            {formatDate(
                              order.createdAt
                            )}
                          </p>
                        </div>

                        <span
                          className={getOrderStatusClass(
                            order.status
                          )}
                        >
                          {order.status ||
                            "Order Placed"}
                        </span>
                      </div>

                      {/* ITEMS */}

                      <div className="order-items">

                        {order.items?.map(
                          (
                            item,
                            index
                          ) => (
                            <div
                              className="order-item"
                              key={`${order.orderId}-${index}`}
                            >

                              <div className="order-item-image">
                                {item.image ? (
                                  <img
                                    src={
                                      item.image
                                    }
                                    alt={
                                      item.name
                                    }
                                  />
                                ) : (
                                  <span>
                                    🍽️
                                  </span>
                                )}
                              </div>

                              <div className="order-item-info">
                                <strong>
                                  {item.name}
                                </strong>

                                <span>
                                  ₹
                                  {item.price}{" "}
                                  ×{" "}
                                  {item.quantity}
                                </span>
                              </div>

                              <strong>
                                ₹
                                {Number(
                                  item.price || 0
                                ) *
                                  Number(
                                    item.quantity ||
                                      0
                                  )}
                              </strong>

                            </div>
                          )
                        )}

                      </div>

                      {/* TOTAL */}

                      <div className="order-summary">

                        <div>
                          <span>
                            Subtotal
                          </span>

                          <strong>
                            ₹
                            {Number(
                              order.subtotal ||
                                0
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Delivery
                          </span>

                          <strong>
                            ₹
                            {Number(
                              order.deliveryCharge ||
                                0
                            )}
                          </strong>
                        </div>

                        <div className="order-total">
                          <span>
                            Total
                          </span>

                          <strong>
                            ₹
                            {Number(
                              order.total || 0
                            )}
                          </strong>
                        </div>

                      </div>

                      {/* CANCEL */}

                      {order.status !==
                        "Delivered" &&
                        order.status !==
                          "Cancelled" && (
                          <div className="account-card-actions">
                            <button
                              className="cancel-button"
                              onClick={() =>
                                cancelOrder(
                                  order.orderId
                                )
                              }
                            >
                              Cancel Order
                            </button>
                          </div>
                        )}

                    </article>
                  )
                )}

              </div>
            )}

          </section>
        )}

        {/* RESERVATIONS */}

        {activeTab === "reservations" && (
          <section className="account-content">

            <div className="content-heading">
              <div>
                <p className="content-label">
                  RESERVATION HISTORY
                </p>

                <h2>
                  My Table Bookings
                </h2>
              </div>

              <button
                className="account-action-button"
                onClick={() =>
                  navigate("/reservation")
                }
              >
                Book a Table →
              </button>
            </div>

            {loadingReservations &&
            activeReservations.length === 0 ? (
              <div className="account-empty">
                <div className="empty-account-icon">
                  ⏳
                </div>

                <h3>
                  Loading bookings...
                </h3>

                <p>
                  Please wait while we load
                  your bookings.
                </p>
              </div>
            ) : activeReservations.length === 0 ? (
              <div className="account-empty">
                <div className="empty-account-icon">
                  📅
                </div>

                <h3>
                  No table bookings yet
                </h3>

                <p>
                  Your table reservations will
                  appear here.
                </p>

                <button
                  className="account-primary-button"
                  onClick={() =>
                    navigate("/reservation")
                  }
                >
                  Reserve a Table
                </button>
              </div>
            ) : (
              <div className="account-list">

                {activeReservations.map(
                  (reservation) => (
                    <article
                      className="account-card booking-card"
                      key={
                        reservation.bookingId
                      }
                    >

                      {/* HEADER */}

                      <div className="account-card-header">
                        <div>
                          <span className="account-card-label">
                            BOOKING ID
                          </span>

                          <strong className="account-id">
                            {
                              reservation.bookingId
                            }
                          </strong>

                          <p>
                            Created{" "}
                            {formatDate(
                              reservation.createdAt
                            )}
                          </p>
                        </div>

                        <span
                          className={getReservationStatusClass(
                            reservation.status
                          )}
                        >
                          {reservation.status ||
                            "Pending"}
                        </span>
                      </div>

                      {/* CUSTOMER */}

                      <div className="booking-customer">

                        <div className="booking-avatar">
                          {(
                            reservation
                              .customer?.name ||
                            "G"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {reservation
                              .customer
                              ?.name ||
                              "Guest"}
                          </strong>

                          <span>
                            ☎{" "}
                            {reservation
                              .customer
                              ?.phone ||
                              "No phone"}
                          </span>
                        </div>

                      </div>

                      {/* DETAILS */}

                      <div className="booking-details">

                        <div>
                          <span>
                            📅 Date
                          </span>

                          <strong>
                            {formatDate(
                              reservation.date
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            🕐 Time
                          </span>

                          <strong>
                            {formatTime(
                              reservation.time
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            👥 Guests
                          </span>

                          <strong>
                            {reservation.guests}
                          </strong>
                        </div>

                        <div>
                          <span>
                            🪑 Table
                          </span>

                          <strong>
                            {reservation.table}
                          </strong>
                        </div>

                      </div>

                      {/* REQUEST */}

                      {reservation.request && (
                        <div className="booking-request">
                          <span>
                            ✦ Special Request
                          </span>

                          <p>
                            {
                              reservation.request
                            }
                          </p>
                        </div>
                      )}

                      {/* CANCEL */}

                      {reservation.status !==
                        "Completed" &&
                        reservation.status !==
                          "Cancelled" && (
                          <div className="account-card-actions">
                            <button
                              className="cancel-button"
                              onClick={() =>
                                cancelReservation(
                                  reservation.bookingId
                                )
                              }
                            >
                              Cancel Booking
                            </button>
                          </div>
                        )}

                    </article>
                  )
                )}

              </div>
            )}

          </section>
        )}

      </main>
    </>
  );
}

export default MyAccount;