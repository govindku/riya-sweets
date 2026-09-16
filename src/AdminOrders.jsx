import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { supabase } from "./lib/supabase";

import "./AdminOrders.css";

function AdminOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [deliveryInputs, setDeliveryInputs] =
    useState({});

  // Only initial loading screen
  const [loading, setLoading] =
    useState(true);

  // Prevent duplicate requests
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  // =====================================================
  // MAP SUPABASE ORDER
  // =====================================================

  const mapSupabaseOrder = (order) => {
    return {
      id: order.id,

      orderId: order.order_id,

      userId: order.user_id,

      customer: {
        name:
          order.customer_name || "",

        phone:
          order.customer_phone || "",

        email:
          order.customer_email || "",

        address:
          order.address || "",

        city:
          order.city || "",

        pincode:
          order.pincode || "",
      },

      items: Array.isArray(order.items)
        ? order.items
        : [],

      subtotal: Number(
        order.subtotal || 0
      ),

      deliveryCharge:
        order.delivery_charge !== null &&
        order.delivery_charge !== undefined
          ? Number(
              order.delivery_charge
            )
          : null,

      total:
        order.total_amount !== null &&
        order.total_amount !== undefined
          ? Number(
              order.total_amount
            )
          : 0,

      paymentMethod:
        order.payment_method ||
        "Online Payment",

      paymentStatus:
        order.payment_status ||
        "Pending",

      paymentId:
        order.razorpay_payment_id ||
        "",

      razorpayOrderId:
        order.razorpay_order_id ||
        "",

      status:
        order.order_status ||
        "Order Placed",

      createdAt:
        order.created_at ||
        new Date().toISOString(),
    };
  };

  // =====================================================
  // LOAD ORDERS
  // =====================================================

  const loadOrders = async (
    showLoading = false
  ) => {
    // Prevent duplicate/overlapping requests
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;

    // Only show loading on first page load
    if (
      showLoading &&
      mountedRef.current
    ) {
      setLoading(true);
    }

    try {
      const { data, error } =
        await supabase
          .from("orders")
          .select("*")
          .order("created_at", {
            ascending: false,
          });

      if (error) {
        console.error(
          "Failed to load orders:",
          error
        );

        // Existing orders ko clear mat karo
        // background refresh fail hone par
        if (
          showLoading &&
          mountedRef.current
        ) {
          alert(
            "Orders load nahi ho rahe hain. Please try again."
          );
        }

        return;
      }

      const mappedOrders =
        (data || []).map(
          mapSupabaseOrder
        );

      if (!mountedRef.current) {
        return;
      }

      setOrders(mappedOrders);

      // Delivery inputs
      const charges = {};

      mappedOrders.forEach(
        (order) => {
          charges[order.orderId] =
            order.deliveryCharge !==
              null &&
            order.deliveryCharge !==
              undefined
              ? order.deliveryCharge
              : "";
        }
      );

      setDeliveryInputs(charges);

      // Compatibility cache
      localStorage.setItem(
        "riyaOrders",
        JSON.stringify(mappedOrders)
      );
    } catch (error) {
      console.error(
        "Load orders error:",
        error
      );
    } finally {
      loadingRef.current = false;

      if (
        showLoading &&
        mountedRef.current
      ) {
        setLoading(false);
      }
    }
  };

  // =====================================================
  // INITIAL LOAD + SILENT BACKGROUND REFRESH
  // =====================================================

  useEffect(() => {
    mountedRef.current = true;

    // First load
    loadOrders(true);

    // Other components can tell Admin Orders
    // that an order changed.
    const handleOrderUpdate = () => {
      // IMPORTANT:
      // No loading screen during background refresh.
      loadOrders(false);
    };

    window.addEventListener(
      "riyaOrderUpdated",
      handleOrderUpdate
    );

    window.addEventListener(
      "storage",
      handleOrderUpdate
    );

    // Background refresh every 10 seconds
    const interval = setInterval(() => {
      loadOrders(false);
    }, 10000);

    return () => {
      mountedRef.current = false;

      window.removeEventListener(
        "riyaOrderUpdated",
        handleOrderUpdate
      );

      window.removeEventListener(
        "storage",
        handleOrderUpdate
      );

      clearInterval(interval);
    };
  }, []);

  // =====================================================
  // UPDATE DELIVERY INPUT
  // =====================================================

  const handleDeliveryChange = (
    orderId,
    value
  ) => {
    if (
      value === "" ||
      /^\d+$/.test(value)
    ) {
      setDeliveryInputs((prev) => ({
        ...prev,
        [orderId]: value,
      }));
    }
  };

  // =====================================================
  // SAVE DELIVERY CHARGE
  // =====================================================

  const saveDeliveryCharge = async (
    orderId
  ) => {
    const chargeValue =
      deliveryInputs[orderId];

    if (
      chargeValue === "" ||
      chargeValue === undefined
    ) {
      alert(
        "Please enter a delivery charge."
      );

      return;
    }

    const deliveryCharge =
      Number(chargeValue);

    if (deliveryCharge < 0) {
      alert(
        "Delivery charge cannot be negative."
      );

      return;
    }

    const currentOrder =
      orders.find(
        (order) =>
          order.orderId === orderId
      );

    if (!currentOrder) {
      alert("Order not found.");
      return;
    }

    const subtotal = Number(
      currentOrder.subtotal || 0
    );

    const total =
      subtotal + deliveryCharge;

    // Optimistic UI
    setOrders((prev) =>
      prev.map((order) =>
        order.orderId === orderId
          ? {
              ...order,
              deliveryCharge,
              total,
            }
          : order
      )
    );

    try {
      const { data, error } =
        await supabase
          .from("orders")
          .update({
            delivery_charge:
              deliveryCharge,

            total_amount: total,
          })
          .eq("order_id", orderId)
          .select()
          .single();

      if (error) {
        console.error(
          "Delivery charge update failed:",
          error
        );

        await loadOrders(false);

        alert(
          "Delivery charge update nahi hua."
        );

        return;
      }

      const mappedOrder =
        mapSupabaseOrder(data);

      setOrders((prev) =>
        prev.map((order) =>
          order.orderId === orderId
            ? mappedOrder
            : order
        )
      );

      // Update input
      setDeliveryInputs((prev) => ({
        ...prev,
        [orderId]:
          mappedOrder.deliveryCharge ??
          "",
      }));

      window.dispatchEvent(
        new Event("riyaOrderUpdated")
      );

      alert(
        `Delivery charge ₹${deliveryCharge} updated successfully.`
      );
    } catch (error) {
      console.error(
        "Delivery charge error:",
        error
      );

      await loadOrders(false);

      alert(
        "Something went wrong while updating delivery charge."
      );
    }
  };

  // =====================================================
  // CHANGE ORDER STATUS
  // =====================================================

  const updateStatus = async (
    orderId,
    newStatus
  ) => {
    // Optimistic UI
    setOrders((prev) =>
      prev.map((order) =>
        order.orderId === orderId
          ? {
              ...order,
              status: newStatus,
            }
          : order
      )
    );

    try {
      const { data, error } =
        await supabase
          .from("orders")
          .update({
            order_status: newStatus,
          })
          .eq("order_id", orderId)
          .select()
          .single();

      if (error) {
        console.error(
          "Status update failed:",
          error
        );

        await loadOrders(false);

        alert(
          "Order status update nahi hua."
        );

        return;
      }

      const mappedOrder =
        mapSupabaseOrder(data);

      setOrders((prev) =>
        prev.map((order) =>
          order.orderId === orderId
            ? mappedOrder
            : order
        )
      );

      // Customer My Account ko notify
      window.dispatchEvent(
        new Event("riyaOrderUpdated")
      );
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      await loadOrders(false);

      alert(
        "Something went wrong while updating status."
      );
    }
  };

  // =====================================================
  // DELETE ORDER
  // =====================================================

  const deleteOrder = async (
    orderId
  ) => {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this order?"
      );

    if (!confirmDelete) return;

    try {
      const { error } =
        await supabase
          .from("orders")
          .delete()
          .eq("order_id", orderId);

      if (error) {
        console.error(
          "Delete order failed:",
          error
        );

        alert(
          "Order delete nahi hua."
        );

        return;
      }

      const updatedOrders =
        orders.filter(
          (order) =>
            order.orderId !== orderId
        );

      setOrders(updatedOrders);

      setDeliveryInputs((prev) => {
        const updated = {
          ...prev,
        };

        delete updated[orderId];

        return updated;
      });

      localStorage.setItem(
        "riyaOrders",
        JSON.stringify(updatedOrders)
      );

      window.dispatchEvent(
        new Event("riyaOrderUpdated")
      );

      alert(
        "Order deleted successfully."
      );
    } catch (error) {
      console.error(
        "Delete order error:",
        error
      );

      alert(
        "Something went wrong while deleting the order."
      );
    }
  };

  // =====================================================
  // CALCULATE REVENUE
  // =====================================================

  const totalRevenue =
    orders.reduce(
      (total, order) =>
        total +
        Number(order.total || 0),
      0
    );

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="orders-admin-page">

      {/* SIDEBAR */}

      <aside className="orders-sidebar">

        <div className="orders-logo">
          <span>RIYA</span>
          <small>
            RESTAURANT ADMIN
          </small>
        </div>

        <nav className="orders-nav">

          <button
            onClick={() =>
              navigate("/admin")
            }
          >
            📊 Dashboard
          </button>

          <button className="active">
            🛒 Orders
          </button>

          <button
            onClick={() =>
              navigate("/admin/users")
            }
          >
            👥 Users
          </button>

          <button
            onClick={() =>
              navigate("/admin/menu")
            }
          >
            🍔 Menu
          </button>

          <button
            onClick={() =>
              navigate("/admin/gallery")
            }
          >
            🖼️ Gallery
          </button>

          <button
            onClick={() =>
              navigate("/admin/settings")
            }
          >
            ⚙️ Settings
          </button>

        </nav>

        <div className="orders-sidebar-bottom">
          <span>
            RIYA SWEETS
          </span>

          <small>
            Admin Panel
          </small>
        </div>

      </aside>

      {/* MAIN */}

      <main className="orders-main">

        {/* TOP BAR */}

        <div className="orders-topbar">

          <div>
            <p>
              ORDER MANAGEMENT
            </p>

            <h1>
              All Orders
            </h1>
          </div>

          <div className="top-actions">

            <button
              className="back-btn"
              onClick={() =>
                navigate("/admin")
              }
            >
              ← Dashboard
            </button>

            <button
              className="refresh-orders-btn"
              onClick={() =>
                loadOrders(false)
              }
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : "↻ Refresh"}
            </button>

          </div>

        </div>

        {/* STATS */}

        <div className="orders-stats">

          <div className="orders-stat-card">
            <span>
              🛒 Total Orders
            </span>

            <strong>
              {orders.length}
            </strong>
          </div>

          <div className="orders-stat-card">
            <span>
              ⏳ Pending
            </span>

            <strong>
              {
                orders.filter(
                  (order) =>
                    order.status ===
                      "Order Placed" ||
                    order.status ===
                      "Confirmed" ||
                    order.status ===
                      "Preparing"
                ).length
              }
            </strong>
          </div>

          <div className="orders-stat-card">
            <span>
              ✅ Delivered
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
          </div>

          <div className="orders-stat-card">
            <span>
              💰 Revenue
            </span>

            <strong>
              ₹{totalRevenue}
            </strong>
          </div>

        </div>

        {/* ORDERS */}

        <section className="orders-section">

          <div className="orders-section-header">

            <div>
              <p>
                RIYA SWEETS
              </p>

              <h2>
                Customer Orders
              </h2>
            </div>

            <span className="order-count">
              {orders.length} Orders
            </span>

          </div>

          {/* INITIAL LOADING */}

          {loading &&
          orders.length === 0 ? (
            <div className="no-orders">

              <div className="empty-icon">
                ⏳
              </div>

              <h2>
                Loading Orders...
              </h2>

              <p>
                Please wait while orders
                are being loaded.
              </p>

            </div>
          ) : orders.length === 0 ? (
            <div className="no-orders">

              <div className="empty-icon">
                🛒
              </div>

              <h2>
                No Orders Found
              </h2>

              <p>
                Customer orders will appear
                here after placing an order.
              </p>

            </div>
          ) : (
            <div className="orders-list">

              {orders.map((order) => {

                const currentDeliveryCharge =
                  deliveryInputs[
                    order.orderId
                  ];

                const subtotal =
                  Number(
                    order.subtotal || 0
                  );

                const deliveryCharge =
                  currentDeliveryCharge ===
                  ""
                    ? 0
                    : Number(
                        currentDeliveryCharge ||
                          0
                      );

                const previewTotal =
                  subtotal +
                  deliveryCharge;

                const isDeliveryAdded =
                  order.deliveryCharge !==
                    null &&
                  order.deliveryCharge !==
                    undefined;

                return (
                  <div
                    className="admin-order-card"
                    key={order.orderId}
                  >

                    {/* HEADER */}

                    <div className="order-card-header">

                      <div>

                        <span>
                          ORDER ID
                        </span>

                        <h3>
                          {order.orderId}
                        </h3>

                        <small>
                          {order.createdAt
                            ? new Date(
                                order.createdAt
                              ).toLocaleString()
                            : ""}
                        </small>

                      </div>

                      <button
                        className="delete-order-btn"
                        onClick={() =>
                          deleteOrder(
                            order.orderId
                          )
                        }
                      >
                        🗑 Delete
                      </button>

                    </div>

                    {/* CUSTOMER */}

                    <div className="customer-section">

                      <h4>
                        Customer Details
                      </h4>

                      <div className="customer-grid">

                        <div>
                          <span>
                            Name
                          </span>

                          <strong>
                            {order.customer
                              ?.name ||
                              "N/A"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Phone
                          </span>

                          <strong>
                            {order.customer
                              ?.phone ||
                              "N/A"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Email
                          </span>

                          <strong>
                            {order.customer
                              ?.email ||
                              "N/A"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            City
                          </span>

                          <strong>
                            {order.customer
                              ?.city ||
                              "N/A"}
                          </strong>
                        </div>

                        <div className="address-box">
                          <span>
                            Address
                          </span>

                          <strong>
                            {order.customer
                              ?.address ||
                              "N/A"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Pincode
                          </span>

                          <strong>
                            {order.customer
                              ?.pincode ||
                              "N/A"}
                          </strong>
                        </div>

                      </div>

                    </div>

                    {/* ITEMS */}

                    <div className="order-items-section">

                      <h4>
                        Ordered Items
                      </h4>

                      <div className="items-list">

                        {order.items?.map(
                          (
                            item,
                            index
                          ) => (
                            <div
                              className="order-item"
                              key={
                                item.id ||
                                index
                              }
                            >

                              <div>

                                <strong>
                                  {item.name}
                                </strong>

                                <span>
                                  ₹
                                  {
                                    item.price
                                  }{" "}
                                  ×{" "}
                                  {
                                    item.quantity
                                  }
                                </span>

                              </div>

                              <strong>
                                ₹
                                {Number(
                                  item.price ||
                                    0
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

                    </div>

                    {/* PRICE / DELIVERY */}

                    <div className="order-card-bottom">

                      {/* PAYMENT */}

                      <div className="payment-info">

                        <span>
                          PAYMENT
                        </span>

                        <strong>
                          {order.paymentMethod ||
                            "Online Payment"}
                        </strong>

                        <small>
                          {order.paymentStatus ||
                            "Pending"}
                        </small>

                      </div>

                      {/* SUBTOTAL */}

                      <div className="order-total">

                        <span>
                          SUBTOTAL
                        </span>

                        <strong>
                          ₹{subtotal}
                        </strong>

                      </div>

                      {/* DELIVERY */}

                      <div className="delivery-charge-admin">

                        <span>
                          DELIVERY CHARGE
                        </span>

                        <div className="delivery-charge-control">

                          <span>
                            ₹
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={
                              currentDeliveryCharge ??
                              ""
                            }
                            onChange={(e) =>
                              handleDeliveryChange(
                                order.orderId,
                                e.target.value
                              )
                            }
                            placeholder="Enter charge"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              saveDeliveryCharge(
                                order.orderId
                              )
                            }
                          >
                            Save
                          </button>

                        </div>

                        {!isDeliveryAdded && (
                          <small>
                            Delivery charge
                            pending
                          </small>
                        )}

                      </div>

                      {/* FINAL TOTAL */}

                      <div className="order-total final">

                        <span>
                          FINAL TOTAL
                        </span>

                        <strong>
                          ₹
                          {isDeliveryAdded
                            ? Number(
                                order.total ||
                                  0
                              )
                            : previewTotal}
                        </strong>

                      </div>

                      {/* STATUS */}

                      <div className="status-section">

                        <span>
                          ORDER STATUS
                        </span>

                        <select
                          value={
                            order.status ||
                            "Order Placed"
                          }
                          onChange={(e) =>
                            updateStatus(
                              order.orderId,
                              e.target.value
                            )
                          }
                        >

                          <option value="Order Placed">
                            Order Placed
                          </option>

                          <option value="Confirmed">
                            Confirmed
                          </option>

                          <option value="Preparing">
                            Preparing
                          </option>

                          <option value="Ready">
                            Ready
                          </option>

                          <option value="Delivered">
                            Delivered
                          </option>

                          <option value="Cancelled">
                            Cancelled
                          </option>

                        </select>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </section>

      </main>
    </div>
  );
}

export default AdminOrders;