import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import "./AdminMenu.css";

const BUCKET_NAME = "menu-images";

const categories = [
  "Starters",
  "Main Course",
  "Pizza & Pasta",
  "Desserts",
  "Drinks",
  "Pizza",
  "Burger",
  "Pasta",
  "Chinese",
  "South Indian",
  "North Indian",
  "Sweet",
  "Anniversary",
];

function AdminMenu() {
  const navigate = useNavigate();

  const [menu, setMenu] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "Starters",
    price: "",
    image: "",
    description: "",
    tag: "",
    available: true,
    isPopular: false,
  });

  // ========================================
  // LOAD MENU FROM SUPABASE
  // ========================================

  const loadMenu = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Load menu error:", error);
        alert("Menu load nahi ho saka.");
        return;
      }

      const formattedMenu = (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: Number(item.price || 0),
        image: item.image_url || "",
        description: item.description || "",
        tag: item.tag || "",
        available: item.available !== false,
        isPopular: item.is_popular === true,
      }));

      setMenu(formattedMenu);
    } catch (error) {
      console.error("Menu error:", error);
      alert("Menu load karte waqt error aaya.");
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    loadMenu();
  }, []);

  // ========================================
  // IMAGE COMPRESSION
  // ========================================

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();

        img.onload = () => {
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;

          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const ratio = Math.min(
              MAX_WIDTH / width,
              MAX_HEIGHT / height
            );

            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement("canvas");

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Canvas not supported."));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Image compression failed."));
                return;
              }

              const compressedFile = new File(
                [blob],
                `riya-${Date.now()}.jpg`,
                {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                }
              );

              resolve(compressedFile);
            },
            "image/jpeg",
            0.78
          );
        };

        img.onerror = () => {
          reject(new Error("Image load failed."));
        };

        img.src = event.target.result;
      };

      reader.onerror = () => {
        reject(new Error("File read failed."));
      };

      reader.readAsDataURL(file);
    });
  };

  // ========================================
  // IMAGE SELECT
  // ========================================

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Image 10MB se chhoti honi chahiye.");
      return;
    }

    try {
      const compressedFile = await compressImage(file);

      setSelectedFile(compressedFile);

      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }

      const previewUrl = URL.createObjectURL(compressedFile);

      setPreviewImage(previewUrl);
    } catch (error) {
      console.error("Image compression error:", error);
      alert("Image process nahi ho paayi.");
    }
  };

  // ========================================
  // UPLOAD IMAGE
  // ========================================

  const uploadImage = async (file) => {
    if (!file) return "";

    const fileName =
      `food-${Date.now()}-` +
      Math.random().toString(36).substring(2, 8) +
      ".jpg";

    const filePath = `menu/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/jpeg",
      });

    if (uploadError) {
      console.error("Image upload error:", uploadError);
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // ========================================
  // FORM CHANGE
  // ========================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ========================================
  // RESET FORM
  // ========================================

  const resetForm = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }

    setForm({
      name: "",
      category: "Starters",
      price: "",
      image: "",
      description: "",
      tag: "",
      available: true,
      isPopular: false,
    });

    setEditingId(null);
    setSelectedFile(null);
    setPreviewImage("");
    setShowForm(false);
  };

  // ========================================
  // OPEN ADD FORM
  // ========================================

  const openAddForm = () => {
    setEditingId(null);

    setForm({
      name: "",
      category: "Starters",
      price: "",
      image: "",
      description: "",
      tag: "",
      available: true,
      isPopular: false,
    });

    setSelectedFile(null);
    setPreviewImage("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ========================================
  // SUBMIT FORM
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Please enter food name.");
      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      alert("Please enter a valid price.");
      return;
    }

    try {
      setSaving(true);

      let imageUrl = form.image || "";

      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }

      // ========================================
      // UPDATE FOOD
      // ========================================

      if (editingId) {
        const { error } = await supabase
          .from("menu_items")
          .update({
            name: form.name.trim(),
            category: form.category,
            price: Number(form.price),
            image_url: imageUrl,
            description: form.description.trim(),
            tag: form.tag.trim(),
            available: form.available,
            is_popular: Boolean(form.isPopular),
          })
          .eq("id", editingId);

        if (error) {
          console.error("Update error:", error);
          alert("Food item update nahi ho saka.");
          return;
        }

        alert("Food item updated successfully!");
      }

      // ========================================
      // ADD FOOD
      // ========================================

      else {
        const { error } = await supabase
          .from("menu_items")
          .insert([
            {
              name: form.name.trim(),
              category: form.category,
              price: Number(form.price),
              image_url: imageUrl,
              description: form.description.trim(),
              tag: form.tag.trim(),
              available: form.available,
              is_popular: Boolean(form.isPopular),
            },
          ]);

        if (error) {
          console.error("Insert error:", error);
          alert("Food item add nahi ho saka.");
          return;
        }

        alert("Food item added successfully!");
      }

      await loadMenu();

      window.dispatchEvent(new Event("riyaMenuUpdated"));

      resetForm();
    } catch (error) {
      console.error("Save menu error:", error);
      alert(`Save failed: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // EDIT FOOD
  // ========================================

  const editItem = (item) => {
    setForm({
      name: item.name || "",
      category: item.category || "Starters",
      price: item.price || "",
      image: item.image || "",
      description: item.description || "",
      tag: item.tag || "",
      available: item.available !== false,
      isPopular: item.isPopular === true,
    });

    setEditingId(item.id);
    setSelectedFile(null);
    setPreviewImage("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ========================================
  // DELETE FOOD
  // ========================================

  const deleteItem = async (id) => {
    const item = menu.find((food) => food.id === id);

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${
        item?.name || "this food item"
      }"?`
    );

    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Delete error:", error);
        alert("Food item delete nahi ho saka.");
        return;
      }

      setMenu((prev) =>
        prev.filter((food) => food.id !== id)
      );

      window.dispatchEvent(new Event("riyaMenuUpdated"));

      // Remove deleted food from cart
      try {
        const savedOrder = localStorage.getItem("riyaOrder");

        if (savedOrder) {
          const orderItems = JSON.parse(savedOrder);

          const updatedOrder = orderItems.filter(
            (orderItem) => orderItem.id !== id
          );

          localStorage.setItem(
            "riyaOrder",
            JSON.stringify(updatedOrder)
          );
        }
      } catch (error) {
        console.error("Cart update error:", error);
      }

      alert("Food item deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Delete karte waqt error aaya.");
    }
  };

  // ========================================
  // TOGGLE AVAILABILITY
  // ========================================

  const toggleAvailability = async (id) => {
    const item = menu.find((food) => food.id === id);

    if (!item) return;

    const newAvailability = item.available === false;

    try {
      const { data, error } = await supabase
        .from("menu_items")
        .update({
          available: newAvailability,
        })
        .eq("id", id)
        .select("id, available, is_popular")
        .single();

      if (error) {
        console.error("Availability error:", error);
        alert("Availability update nahi ho paayi.");
        return;
      }

      setMenu((prev) =>
        prev.map((food) =>
          food.id === id
            ? {
                ...food,
                available: data.available,
                isPopular: data.is_popular === true,
              }
            : food
        )
      );

      window.dispatchEvent(new Event("riyaMenuUpdated"));
    } catch (error) {
      console.error("Availability error:", error);
      alert("Availability update karte waqt error aaya.");
    }
  };

  // ========================================
  // TOGGLE POPULAR
  // ========================================

  const togglePopular = async (id) => {
    const item = menu.find((food) => food.id === id);

    if (!item) return;

    const newPopularStatus = item.isPopular !== true;

    try {
      const { data, error } = await supabase
        .from("menu_items")
        .update({
          is_popular: newPopularStatus,
        })
        .eq("id", id)
        .select("id, is_popular, available")
        .single();

      if (error) {
        console.error("Popular update error:", error);
        alert("Popular status update nahi ho saka.");
        return;
      }

      if (!data) {
        alert("Popular status save nahi hua.");
        return;
      }

      const savedPopularStatus = data.is_popular === true;

      setMenu((prev) =>
        prev.map((food) =>
          food.id === id
            ? {
                ...food,
                isPopular: savedPopularStatus,
                available: data.available !== false,
              }
            : food
        )
      );

      // Home page ko update signal
      window.dispatchEvent(new Event("riyaMenuUpdated"));

      console.log(
        `Popular status saved: ${savedPopularStatus}`
      );

      alert(
        savedPopularStatus
          ? "⭐ Item Home ke Popular section mein add ho gaya!"
          : "Item Popular section se remove ho gaya."
      );
    } catch (error) {
      console.error("Popular error:", error);
      alert("Popular status update karte waqt error aaya.");
    }
  };

  // ========================================
  // LOGOUT
  // ========================================

  const handleLogout = () => {
    localStorage.removeItem("riyaAdminLoggedIn");
    navigate("/admin/login");
  };

  // ========================================
  // UI
  // ========================================

  return (
    <div className="admin-menu-page">
      {/* SIDEBAR */}

      <aside className="menu-sidebar">
        <div className="menu-logo">
          <span>RIYA</span>
          <small>RESTAURANT ADMIN</small>
        </div>

        <nav className="menu-nav">
          <button type="button" onClick={() => navigate("/admin")}>
            📊 Dashboard
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/orders")}
          >
            🛒 Orders
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/users")}
          >
            👥 Users
          </button>

          <button
            type="button"
            className="active"
            onClick={() => navigate("/admin/menu")}
          >
            🍔 Menu
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/gallery")}
          >
            🖼️ Gallery
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/settings")}
          >
            ⚙️ Settings
          </button>
        </nav>

        <div className="menu-sidebar-bottom">
          <span>RIYA RESTAURANT</span>
          <small>Admin Panel</small>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              marginTop: "15px",
              width: "100%",
              padding: "10px",
              cursor: "pointer",
            }}
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}

      <main className="menu-admin-main">
        {/* TOPBAR */}

        <div className="menu-topbar">
          <div>
            <p>RESTAURANT MANAGEMENT</p>
            <h1>Menu Management</h1>
          </div>

          <button
            type="button"
            className="add-menu-btn"
            onClick={openAddForm}
          >
            + Add Food
          </button>
        </div>

        {/* FORM */}

        {showForm && (
          <section className="menu-form-card">
            <div className="form-heading">
              <div>
                <p>{editingId ? "EDIT ITEM" : "NEW ITEM"}</p>

                <h2>
                  {editingId
                    ? "Edit Food Item"
                    : "Add New Food"}
                </h2>
              </div>

              <button
                type="button"
                className="close-form-btn"
                onClick={resetForm}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {/* NAME */}

                <div className="form-group">
                  <label>Food Name</label>

                  <input
                    type="text"
                    name="name"
                    placeholder="Enter food name"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>

                {/* CATEGORY */}

                <div className="form-group">
                  <label>Category</label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >
                    {categories.map((category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* PRICE */}

                <div className="form-group">
                  <label>Price ₹</label>

                  <input
                    type="number"
                    name="price"
                    min="1"
                    placeholder="Enter price"
                    value={form.price}
                    onChange={handleChange}
                  />
                </div>

                {/* IMAGE */}

                <div className="form-group">
                  <label>Food Image</label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />

                  <small
                    style={{
                      marginTop: "7px",
                      color: "#777780",
                      fontSize: "11px",
                      display: "block",
                    }}
                  >
                    📱 Mobile: Gallery se image select
                    karo ya camera se photo lo.
                  </small>

                  {(previewImage || form.image) && (
                    <div
                      style={{
                        marginTop: "12px",
                        width: "120px",
                        height: "90px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid #292932",
                      }}
                    >
                      <img
                        src={previewImage || form.image}
                        alt="Food preview"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* TAG */}

                <div className="form-group">
                  <label>Food Tag</label>

                  <input
                    type="text"
                    name="tag"
                    placeholder="Popular / Chef's Choice"
                    value={form.tag}
                    onChange={handleChange}
                  />
                </div>

                {/* DESCRIPTION */}

                <div className="form-group full-width">
                  <label>Description</label>

                  <textarea
                    name="description"
                    placeholder="Enter food description"
                    value={form.description}
                    onChange={handleChange}
                    rows="4"
                  />
                </div>

                {/* AVAILABILITY */}

                <div className="availability-control">
                  <label>
                    <input
                      type="checkbox"
                      name="available"
                      checked={form.available}
                      onChange={handleChange}
                    />

                    <span>Food is available</span>
                  </label>
                </div>

                {/* POPULAR */}

                <div className="availability-control">
                  <label>
                    <input
                      type="checkbox"
                      name="isPopular"
                      checked={form.isPopular}
                      onChange={handleChange}
                    />

                    <span>⭐ Show on Homepage</span>
                  </label>
                </div>
              </div>

              {/* ACTIONS */}

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-menu-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Uploading..."
                    : editingId
                    ? "Update Food"
                    : "Add Food"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* STATS */}

        <div className="menu-stats">
          <div className="menu-stat">
            <span>Total Items</span>
            <strong>{menu.length}</strong>
          </div>

          <div className="menu-stat">
            <span>Available</span>

            <strong>
              {
                menu.filter(
                  (item) => item.available !== false
                ).length
              }
            </strong>
          </div>

          <div className="menu-stat">
            <span>Popular</span>

            <strong>
              {
                menu.filter(
                  (item) => item.isPopular === true
                ).length
              }
            </strong>
          </div>

          <div className="menu-stat">
            <span>Unavailable</span>

            <strong>
              {
                menu.filter(
                  (item) => item.available === false
                ).length
              }
            </strong>
          </div>
        </div>

        {/* MENU LIST */}

        <section className="admin-menu-list">
          <div className="menu-list-heading">
            <div>
              <p>FOOD ITEMS</p>
              <h2>Restaurant Menu</h2>
            </div>

            <button
              type="button"
              onClick={loadMenu}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div className="empty-menu">
              <div>⏳</div>

              <h2>Loading Menu...</h2>

              <p>
                Supabase se menu load ho raha hai.
              </p>
            </div>
          ) : menu.length === 0 ? (
            <div className="empty-menu">
              <div>🍔</div>

              <h2>No Food Items</h2>

              <p>
                Add your first food item to the
                restaurant menu.
              </p>
            </div>
          ) : (
            <div className="menu-items-grid">
              {menu.map((item) => (
                <div
                  className="admin-food-card"
                  key={item.id}
                >
                  {/* FOOD IMAGE */}

                  <div className="food-image">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                      />
                    ) : (
                      <div className="no-image">
                        🍔
                      </div>
                    )}

                    <span
                      className={
                        item.available
                          ? "available"
                          : "unavailable"
                      }
                    >
                      {item.available
                        ? "Available"
                        : "Unavailable"}
                    </span>

                    {/* POPULAR BADGE */}

                    {item.isPopular && (
                      <span
                        style={{
                          position: "absolute",
                          top: "10px",
                          left: "10px",
                          padding: "5px 9px",
                          borderRadius: "20px",
                          background: "#d9a441",
                          color: "#111",
                          fontSize: "11px",
                          fontWeight: "700",
                        }}
                      >
                        ⭐ Popular
                      </span>
                    )}
                  </div>

                  {/* CONTENT */}

                  <div className="food-content">
                    <div className="food-category">
                      {item.category}
                    </div>

                    <h3>{item.name}</h3>

                    <p>
                      {item.description ||
                        "No description available."}
                    </p>

                    <div className="food-bottom">
                      <strong>₹{item.price}</strong>

                      <span>
                        {String(item.id).substring(0, 8)}
                      </span>
                    </div>

                    {/* ACTIONS */}

                    <div className="food-actions">
                      {/* POPULAR BUTTON */}

                      <button
                        type="button"
                        className="availability-btn"
                        onClick={() =>
                          togglePopular(item.id)
                        }
                      >
                        {item.isPopular
                          ? "⭐ Remove Popular"
                          : "☆ Make Popular"}
                      </button>

                      {/* AVAILABILITY */}

                      <button
                        type="button"
                        className="availability-btn"
                        onClick={() =>
                          toggleAvailability(item.id)
                        }
                      >
                        {item.available
                          ? "Make Unavailable"
                          : "Make Available"}
                      </button>

                      {/* EDIT */}

                      <button
                        type="button"
                        className="edit-food-btn"
                        onClick={() => editItem(item)}
                      >
                        ✏️ Edit
                      </button>

                      {/* DELETE */}

                      <button
                        type="button"
                        className="delete-food-btn"
                        onClick={() =>
                          deleteItem(item.id)
                        }
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminMenu;
