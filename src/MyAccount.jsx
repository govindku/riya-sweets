import { useEffect, useMemo, useState } from "react";
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
  const [loadingReservations, setLoadingReservations] = useState(false);

  // =========================
  // GET LOGGED-IN USER
  // =========================
  const getLoggedInUser = () => {
    return JSON.parse(
      localStorage.getItem("riyaLoggedInUser") || "null",
    );
  };

  // =========================
  // LOAD ORDERS FROM LOCAL
  // =========================
  const loadOrders = (user) => {
    if (!user) {
      setOrders([]);
      return;
    }

    const savedOrders = JSON.parse(
      localStorage.getItem("riyaOrders") || "[]",
    );

    const userEmail = user.email?.toLowerCase();

    const userOrders = savedOrders.filter((order) => {
      const orderUserId = order.userId?.toLowerCase();
      const orderEmail = order.customer?.email?.toLowerCase();

      return (
        (orderUserId && orderUserId === userEmail) ||
        (orderEmail && orderEmail === userEmail)
      );
    });

    setOrders(userOrders);
  };

  // =========================
  // LOAD RESERVATIONS FROM SUPABASE
  // =========================
  const loadReservations = async (user = loggedInUser) => {
    if (!user?.email) {
      setReservations([]);
      return;
    }

    try {
      setLoadingReservations(true);

      const userEmail = user.email.toLowerCase();

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
          error,
        );

        setReservations([]);
        return;
      }

      const formattedReservations = (data || []).map(
        (reservation) => ({
          id: reservation.id,

          bookingId: reservation.booking_id,

          userId: reservation.user_id,

          customer: {
            name: reservation.customer_name,
            phone: reservation.customer_phone,
            email: reservation.customer_email || "",
          },

          date: reservation.reservation_date,

          time: reservation.reservation_time,

          guests: reservation.guests,

          table: reservation.table_preference,

          request: reservation.special_request || "",

          status: reservation.status || "Pending",

          createdAt: reservation.created_at,
        }),
      );

      setReservations(formattedReservations);
    } catch (error) {
      console.error(
        "My Account reservation error:",
        error,
      );

      setReservations([]);
    } finally {
      setLoadingReservations(false);
    }
  };

  // =========================
  // LOAD ALL CUSTOMER DATA
  // =========================
  const loadData = async () => {
    const user = getLoggedInUser();

    if (!user) {
      setLoggedInUser(null);
      setOrders([]);
      setReservations([]);
      return;
    }

    setLoggedInUser(user);

    loadOrders(user);
    await loadReservations(user);
  };

  // =========================
  // INITIAL LOAD + LIVE UPDATE
  // =========================
  useEffect(() => {
    loadData();

    // Local order/reservation updates
    const handleLocalUpdate = () => {
      const user = getLoggedInUser();

      if (!user) {
        setLoggedInUser(null);
        setOrders([]);
        setReservations([]);
        return;
      }

      setLoggedInUser(user);
      loadOrders(user);
      loadReservations(user);
    };

    window.addEventListener(
      "storage",
      handleLocalUpdate,
    );

    window.addEventListener(
      "riyaOrderUpdated",
      handleLocalUpdate,
    );

    window.addEventListener(
      "riyaReservationUpdated",
      handleLocalUpdate,
    );

    // =========================
    // LIVE RESERVATION REFRESH
    // =========================
    // Owner can update reservation status
    // from Admin panel. This checks Supabase
    // every 5 seconds.
    const liveRefresh = setInterval(() => {
      const user = getLoggedInUser();

      if (user) {
        loadReservations(user);
      }
    }, 5000);

    return () => {
      window.removeEventListener(
        "storage",
        handleLocalUpdate,
      );

      window.removeEventListener(
        "riyaOrderUpdated",
        handleLocalUpdate,
      );

      window.removeEventListener(
        "riyaReservationUpdated",
        handleLocalUpdate,
      );

      clearInterval(liveRefresh);
    };
  }, []);

  // =========================
  // CANCEL ORDER
  // =========================
  const cancelOrder = (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?",
    );

    if (!confirmed) return;

    const allOrders = JSON.parse(
      localStorage.getItem("riyaOrders") || "[]",
    );

    const userEmail =
      loggedInUser?.email?.toLowerCase();

    const updatedOrders = allOrders.map((order) => {
      const orderUserId =
        order.userId?.toLowerCase();

      const orderEmail =
        order.customer?.email?.toLowerCase();

      const isCurrentUser =
        orderUserId === userEmail ||
        orderEmail === userEmail;

      if (
        order.orderId === orderId &&
        isCurrentUser
      ) {
        return {
          ...order,
          status: "Cancelled",
        };
      }

      return order;
    });

    localStorage.setItem(
      "riyaOrders",
      JSON.stringify(updatedOrders),
    );

    loadOrders(loggedInUser);

    window.dispatchEvent(
      new Event("riyaOrderUpdated"),
    );
  };

  // =========================
  // CANCEL RESERVATION
  // =========================
  const cancelReservation = async (bookingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this table reservation?",
    );

    if (!confirmed) return;

    try {
      const userEmail =
        loggedInUser?.email?.toLowerCase();

      if (!userEmail) return;

      // Make sure this booking belongs
      // to the logged-in customer.
      const { data: booking, error: findError } =
        await supabase
          .from("reservations")
          .select("id, booking_id, user_id, status")
          .eq("booking_id", bookingId)
          .eq("user_id", userEmail)
          .single();

      if (findError || !booking) {
        console.error(
          "Reservation not found:",
          findError,
        );

        alert(
          "This booking could not be found.",
        );

        return;
      }

      // Do not allow cancellation
      // after completion/cancellation.
      if (
        booking.status === "Completed" ||
        booking.status === "Cancelled"
      ) {
        alert(
          "This booking can no longer be cancelled.",
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
          updateError,
        );

        alert(
          "Booking could not be cancelled. Please try again.",
        );

        return;
      }

      await loadReservations(loggedInUser);

      window.dispatchEvent(
        new Event("riyaReservationUpdated"),
      );
    } catch (error) {
      console.error(
        "Cancel reservation error:",
        error,
      );

      alert(
        "Something went wrong. Please try again.",
      );
    }
  };

  // =========================
  // FORMAT DATE
  // =========================
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
      },
    );
  };

  // =========================
  // FORMAT TIME
  // =========================
  const formatTime = (time) => {
    if (!time) return "—";

    const [hours, minutes] =
      time.split(":");

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0,
    );

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  };

  // =========================
  // ORDER STATUS CLASS
  // =========================
  const getOrderStatusClass = (status) => {
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

  // =========================
  // RESERVATION STATUS CLASS
  // =========================
  const getReservationStatusClass = (
    status,
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

  // =========================
  // SORT ORDERS
  // =========================
  const activeOrders = useMemo(() => {
    return [...orders].reverse();
  }, [orders]);

  // =========================
  // SORT RESERVATIONS
  // =========================
  const activeReservations = useMemo(() => {
    return reservations;
  }, [reservations]);

  // =========================
  // NOT LOGGED IN
  // =========================
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
              Login to view your orders and table
              bookings.
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

        {/* =========================
            HERO
        ========================= */}
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
            . Track your orders and manage your
            table reservations from one place.
          </p>
        </section>

        {/* =========================
            PROFILE SUMMARY
        ========================= */}
        <section className="account-profile">

          <div className="profile-avatar">
            {(loggedInUser.name || "G")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="profile-info">
            <span>WELCOME BACK</span>

            <h2>
              {loggedInUser.name ||
                "Customer"}
            </h2>

            <p>{loggedInUser.email}</p>

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

        {/* =========================
            TABS
        ========================= */}
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
              <strong>My Orders</strong>

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
              activeTab ===
              "reservations"
                ? "account-tab active"
                : "account-tab"
            }
            onClick={() =>
              setActiveTab(
                "reservations",
              )
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

        {/* =========================
            ORDERS
        ========================= */}
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

            {activeOrders.length === 0 ? (
              <div className="account-empty">

                <div className="empty-account-icon">
                  🛒
                </div>

                <h3>No orders yet</h3>

                <p>
                  Your food orders will
                  appear here after you
                  place an order.
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

                      {/* ORDER HEADER */}
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
                              order.createdAt,
                            )}
                          </p>
                        </div>

                        <span
                          className={getOrderStatusClass(
                            order.status,
                          )}
                        >
                          {order.status ||
                            "Order Placed"}
                        </span>
                      </div>

                      {/* ORDER ITEMS */}
                      <div className="order-items">

                        {order.items?.map(
                          (
                            item,
                            index,
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
                                  {
                                    item.quantity
                                  }
                                </span>
                              </div>

                              <strong>
                                ₹
                                {Number(
                                  item.price,
                                ) *
                                  Number(
                                    item.quantity,
                                  )}
                              </strong>
                            </div>
                          ),
                        )}
                      </div>

                      {/* ORDER TOTAL */}
                      <div className="order-summary">

                        <div>
                          <span>
                            Subtotal
                          </span>

                          <strong>
                            ₹
                            {order.subtotal ||
                              0}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Delivery
                          </span>

                          <strong>
                            ₹
                            {order.deliveryCharge ||
                              0}
                          </strong>
                        </div>

                        <div className="order-total">

                          <span>
                            Total
                          </span>

                          <strong>
                            ₹
                            {order.total ||
                              0}
                          </strong>
                        </div>
                      </div>

                      {/* CANCEL ORDER */}
                      {order.status !==
                        "Delivered" &&
                        order.status !==
                          "Cancelled" && (
                          <div className="account-card-actions">

                            <button
                              className="cancel-button"
                              onClick={() =>
                                cancelOrder(
                                  order.orderId,
                                )
                              }
                            >
                              Cancel Order
                            </button>

                          </div>
                        )}
                    </article>
                  ),
                )}
              </div>
            )}
          </section>
        )}

        {/* =========================
            RESERVATIONS
        ========================= */}
        {activeTab ===
          "reservations" && (
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
                  navigate(
                    "/reservation",
                  )
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
                  Please wait while we
                  load your bookings.
                </p>
              </div>
            ) : activeReservations.length ===
              0 ? (
              <div className="account-empty">

                <div className="empty-account-icon">
                  📅
                </div>

                <h3>
                  No table bookings yet
                </h3>

                <p>
                  Your table reservations
                  will appear here.
                </p>

                <button
                  className="account-primary-button"
                  onClick={() =>
                    navigate(
                      "/reservation",
                    )
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

                      {/* BOOKING HEADER */}
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
                              reservation.createdAt,
                            )}
                          </p>
                        </div>

                        <span
                          className={getReservationStatusClass(
                            reservation.status,
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
                              .customer
                              ?.name ||
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

                      {/* BOOKING DETAILS */}
                      <div className="booking-details">

                        <div>
                          <span>
                            📅 Date
                          </span>

                          <strong>
                            {formatDate(
                              reservation.date,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            🕐 Time
                          </span>

                          <strong>
                            {formatTime(
                              reservation.time,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            👥 Guests
                          </span>

                          <strong>
                            {
                              reservation.guests
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            🪑 Table
                          </span>

                          <strong>
                            {
                              reservation.table
                            }
                          </strong>
                        </div>
                      </div>

                      {/* SPECIAL REQUEST */}
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

                      {/* CANCEL BOOKING */}
                      {reservation.status !==
                        "Completed" &&
                        reservation.status !==
                          "Cancelled" && (
                          <div className="account-card-actions">

                            <button
                              className="cancel-button"
                              onClick={() =>
                                cancelReservation(
                                  reservation.bookingId,
                                )
                              }
                            >
                              Cancel Booking
                            </button>

                          </div>
                        )}
                    </article>
                  ),
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
