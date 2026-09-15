import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminReservations.css";
import { supabase } from "./lib/supabase";

function AdminReservations() {
  const navigate = useNavigate();

  const [reservations, setReservations] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // LOAD RESERVATIONS
  // =========================
  const loadReservations = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Admin reservations load error:",
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

      // Keep localStorage compatible with existing parts
      localStorage.setItem(
        "riyaReservations",
        JSON.stringify(formattedReservations),
      );
    } catch (error) {
      console.error(
        "Admin reservations error:",
        error,
      );

      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // INITIAL LOAD
  // =========================
  useEffect(() => {
    loadReservations();

    const handleUpdate = () => {
      loadReservations();
    };

    window.addEventListener(
      "storage",
      handleUpdate,
    );

    window.addEventListener(
      "riyaReservationUpdated",
      handleUpdate,
    );

    // =========================
    // LIVE REFRESH
    // =========================
    // Keeps Admin panel synchronized
    // with Supabase.
    const liveRefresh = setInterval(() => {
      loadReservations();
    }, 5000);

    return () => {
      window.removeEventListener(
        "storage",
        handleUpdate,
      );

      window.removeEventListener(
        "riyaReservationUpdated",
        handleUpdate,
      );

      clearInterval(liveRefresh);
    };
  }, []);

  // =========================
  // UPDATE STATUS
  // =========================
  const updateStatus = async (
    bookingId,
    newStatus,
  ) => {
    try {
      // Optimistic UI update
      setReservations((current) =>
        current.map((reservation) =>
          reservation.bookingId === bookingId
            ? {
                ...reservation,
                status: newStatus,
              }
            : reservation,
        ),
      );

      const { data, error } = await supabase
        .from("reservations")
        .update({
          status: newStatus,
        })
        .eq("booking_id", bookingId)
        .select()
        .single();

      if (error) {
        console.error(
          "Reservation status update error:",
          error,
        );

        // Reload actual data if update failed
        await loadReservations();

        alert(
          "Status update failed. Please try again.",
        );

        return;
      }

      // Update localStorage compatibility
      const updatedReservation = {
        id: data.id,

        bookingId: data.booking_id,

        userId: data.user_id,

        customer: {
          name: data.customer_name,
          phone: data.customer_phone,
          email: data.customer_email || "",
        },

        date: data.reservation_date,

        time: data.reservation_time,

        guests: data.guests,

        table: data.table_preference,

        request: data.special_request || "",

        status: data.status,

        createdAt: data.created_at,
      };

      const savedReservations = JSON.parse(
        localStorage.getItem(
          "riyaReservations",
        ) || "[]",
      );

      const updatedLocalReservations =
        savedReservations.map(
          (reservation) =>
            reservation.bookingId ===
            bookingId
              ? updatedReservation
              : reservation,
        );

      localStorage.setItem(
        "riyaReservations",
        JSON.stringify(
          updatedLocalReservations,
        ),
      );

      // Notify My Account / other components
      window.dispatchEvent(
        new Event("riyaReservationUpdated"),
      );

      console.log(
        `Booking ${bookingId} updated to ${newStatus}`,
      );
    } catch (error) {
      console.error(
        "Update status error:",
        error,
      );

      await loadReservations();

      alert(
        "Something went wrong while updating the status.",
      );
    }
  };

  // =========================
  // DELETE RESERVATION
  // =========================
  const deleteReservation = async (
    bookingId,
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this reservation?",
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("booking_id", bookingId);

      if (error) {
        console.error(
          "Reservation delete error:",
          error,
        );

        alert(
          "Reservation could not be deleted. Please try again.",
        );

        return;
      }

      // Remove from current UI
      setReservations((current) =>
        current.filter(
          (reservation) =>
            reservation.bookingId !==
            bookingId,
        ),
      );

      // Update localStorage compatibility
      const savedReservations = JSON.parse(
        localStorage.getItem(
          "riyaReservations",
        ) || "[]",
      );

      const updatedLocalReservations =
        savedReservations.filter(
          (reservation) =>
            reservation.bookingId !==
            bookingId,
        );

      localStorage.setItem(
        "riyaReservations",
        JSON.stringify(
          updatedLocalReservations,
        ),
      );

      // Notify My Account
      window.dispatchEvent(
        new Event("riyaReservationUpdated"),
      );
    } catch (error) {
      console.error(
        "Delete reservation error:",
        error,
      );

      alert(
        "Something went wrong while deleting the reservation.",
      );
    }
  };

  // =========================
  // FILTER
  // =========================
  const filteredReservations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reservations.filter(
      (reservation) => {
        const customerName =
          reservation.customer?.name || "";

        const phone =
          reservation.customer?.phone || "";

        const bookingId =
          reservation.bookingId || "";

        const matchesSearch =
          !query ||
          customerName
            .toLowerCase()
            .includes(query) ||
          phone
            .toLowerCase()
            .includes(query) ||
          bookingId
            .toLowerCase()
            .includes(query);

        const matchesStatus =
          statusFilter === "All" ||
          reservation.status ===
            statusFilter;

        const matchesDate =
          !dateFilter ||
          reservation.date === dateFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesDate
        );
      },
    );
  }, [
    reservations,
    search,
    statusFilter,
    dateFilter,
  ]);

  // =========================
  // STATS
  // =========================
  const stats = {
    total: reservations.length,

    pending: reservations.filter(
      (reservation) =>
        reservation.status === "Pending",
    ).length,

    confirmed: reservations.filter(
      (reservation) =>
        reservation.status === "Confirmed",
    ).length,

    completed: reservations.filter(
      (reservation) =>
        reservation.status === "Completed",
    ).length,

    cancelled: reservations.filter(
      (reservation) =>
        reservation.status === "Cancelled",
    ).length,
  };

  // =========================
  // FORMAT DATE
  // =========================
  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(
      `${date}T00:00:00`,
    );

    if (
      Number.isNaN(
        parsedDate.getTime(),
      )
    ) {
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
  // STATUS CLASS
  // =========================
  const getStatusClass = (status) => {
    switch (status) {
      case "Confirmed":
        return "status-confirmed";

      case "Completed":
        return "status-completed";

      case "Cancelled":
        return "status-cancelled";

      default:
        return "status-pending";
    }
  };

  // =========================
  // CLEAR FILTERS
  // =========================
  const clearFilters = () => {
    setSearch("");
    setDateFilter("");
    setStatusFilter("All");
  };

  return (
    <div className="admin-reservations-page">

      {/* =========================
          HEADER
      ========================= */}
      <header className="reservations-header">

        <div className="reservations-header-left">

          <button
            className="back-button"
            onClick={() =>
              navigate("/admin")
            }
          >
            <span>←</span>
            Dashboard
          </button>

          <div className="header-title-wrap">

            <p className="admin-section-label">
              RIYA SWEETS
            </p>

            <h1>Reservations</h1>

            <p>
              Manage table reservations and
              customer booking requests.
            </p>
          </div>
        </div>

        <button
          className="refresh-button"
          onClick={loadReservations}
          disabled={loading}
        >
          <span>↻</span>

          {loading
            ? "Loading..."
            : "Refresh"}
        </button>
      </header>

      {/* =========================
          STATS
      ========================= */}
      <section className="reservation-stats">

        <div className="reservation-stat total-stat">

          <div className="stat-icon">
            📋
          </div>

          <div>
            <span>
              Total Reservations
            </span>

            <strong>
              {stats.total}
            </strong>
          </div>
        </div>

        <div className="reservation-stat pending-stat">

          <div className="stat-icon">
            ⏳
          </div>

          <div>
            <span>Pending</span>

            <strong>
              {stats.pending}
            </strong>
          </div>
        </div>

        <div className="reservation-stat confirmed-stat">

          <div className="stat-icon">
            ✓
          </div>

          <div>
            <span>Confirmed</span>

            <strong>
              {stats.confirmed}
            </strong>
          </div>
        </div>

        <div className="reservation-stat completed-stat">

          <div className="stat-icon">
            ★
          </div>

          <div>
            <span>Completed</span>

            <strong>
              {stats.completed}
            </strong>
          </div>
        </div>

        <div className="reservation-stat cancelled-stat">

          <div className="stat-icon">
            ×
          </div>

          <div>
            <span>Cancelled</span>

            <strong>
              {stats.cancelled}
            </strong>
          </div>
        </div>
      </section>

      {/* =========================
          FILTER PANEL
      ========================= */}
      <section className="reservation-toolbar">

        <div className="toolbar-heading">

          <div>

            <h2>
              All Reservations
            </h2>

            <p>
              {filteredReservations.length}{" "}
              reservation
              {filteredReservations.length !==
              1
                ? "s"
                : ""}{" "}
              found
            </p>
          </div>
        </div>

        <div className="reservation-filters">

          <div className="search-wrapper">

            <span className="search-icon">
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search booking, name or phone..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value,
                )
              }
            />
          </div>

          <div className="filter-field">

            <span>STATUS</span>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value,
                )
              }
            >
              <option value="All">
                All Status
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Confirmed">
                Confirmed
              </option>

              <option value="Completed">
                Completed
              </option>

              <option value="Cancelled">
                Cancelled
              </option>
            </select>
          </div>

          <div className="filter-field date-field">

            <span>DATE</span>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(
                  e.target.value,
                )
              }
            />
          </div>

          {(search ||
            dateFilter ||
            statusFilter !== "All") && (
            <button
              className="clear-filter-button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}
        </div>
      </section>

      {/* =========================
          RESERVATIONS
      ========================= */}
      <section className="reservations-list">

        {filteredReservations.length ===
        0 ? (
          <div className="no-reservations">

            <div className="empty-icon">
              📅
            </div>

            <h2>
              No Reservations Found
            </h2>

            <p>
              {reservations.length === 0
                ? "Customer reservations will appear here."
                : "Try changing your search or filters."}
            </p>

            {(search ||
              dateFilter ||
              statusFilter !== "All") && (
              <button
                className="empty-clear-button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredReservations.map(
            (reservation) => (
              <article
                className="reservation-card"
                key={reservation.bookingId}
              >

                {/* =========================
                    CARD HEADER
                ========================= */}
                <div className="reservation-card-top">

                  <div className="booking-info">

                    <span className="booking-label">
                      BOOKING ID
                    </span>

                    <strong className="booking-id">
                      {
                        reservation.bookingId
                      }
                    </strong>
                  </div>

                  <span
                    className={`reservation-status ${getStatusClass(
                      reservation.status,
                    )}`}
                  >
                    <span className="status-dot"></span>

                    {reservation.status ||
                      "Pending"}
                  </span>
                </div>

                {/* =========================
                    CUSTOMER
                ========================= */}
                <div className="reservation-customer">

                  <div className="customer-avatar">

                    {(
                      reservation.customer
                        ?.name || "G"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="customer-main">

                    <h3>
                      {reservation.customer
                        ?.name ||
                        "Unknown Customer"}
                    </h3>

                    <p>
                      <span>☎</span>

                      {reservation.customer
                        ?.phone ||
                        "No phone number"}
                    </p>
                  </div>
                </div>

                {/* =========================
                    DETAILS
                ========================= */}
                <div className="reservation-details-grid">

                  <div className="detail-item">

                    <span className="detail-icon">
                      📅
                    </span>

                    <div>
                      <small>Date</small>

                      <strong>
                        {formatDate(
                          reservation.date,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="detail-item">

                    <span className="detail-icon">
                      🕐
                    </span>

                    <div>
                      <small>Time</small>

                      <strong>
                        {formatTime(
                          reservation.time,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="detail-item">

                    <span className="detail-icon">
                      👥
                    </span>

                    <div>
                      <small>Guests</small>

                      <strong>
                        {reservation.guests ||
                          0}
                      </strong>
                    </div>
                  </div>

                  <div className="detail-item">

                    <span className="detail-icon">
                      🪑
                    </span>

                    <div>
                      <small>Table</small>

                      <strong>
                        {reservation.table ||
                          "—"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* =========================
                    SPECIAL REQUEST
                ========================= */}
                {reservation.request && (
                  <div className="special-request">

                    <div className="request-title">

                      <span>✦</span>

                      Special Request
                    </div>

                    <p>
                      {reservation.request}
                    </p>
                  </div>
                )}

                {/* =========================
                    ACTIONS
                ========================= */}
                <div className="reservation-actions">

                  <div className="status-control">

                    <label>
                      Update Status
                    </label>

                    <select
                      value={
                        reservation.status ||
                        "Pending"
                      }
                      onChange={(e) =>
                        updateStatus(
                          reservation.bookingId,
                          e.target.value,
                        )
                      }
                    >
                      <option value="Pending">
                        Pending
                      </option>

                      <option value="Confirmed">
                        Confirmed
                      </option>

                      <option value="Completed">
                        Completed
                      </option>

                      <option value="Cancelled">
                        Cancelled
                      </option>
                    </select>
                  </div>

                  <button
                    className="delete-reservation"
                    onClick={() =>
                      deleteReservation(
                        reservation.bookingId,
                      )
                    }
                  >
                    <span>♲</span>
                    Delete
                  </button>
                </div>
              </article>
            ),
          )
        )}
      </section>
    </div>
  );
}

export default AdminReservations;
