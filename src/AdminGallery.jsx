import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import "./AdminGallery.css";

function AdminGallery() {
  const navigate = useNavigate();

  const [gallery, setGallery] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "Restaurant",
    description: "",
    available: true,
  });

  // =========================
  // LOAD GALLERY
  // =========================
  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Gallery load error:", error);
        alert("Gallery load failed.");
        return;
      }

      setGallery(data || []);
    } catch (error) {
      console.error("Gallery error:", error);
      alert("Something went wrong while loading gallery.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FILE SELECT
  // =========================
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("Image size must be less than 5MB.");
      return;
    }

    setSelectedFile(file);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  // =========================
  // UPLOAD IMAGE
  // =========================
  const uploadImage = async (file) => {
    if (!file) return null;

    const fileExt = file.name.split(".").pop();

    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}.${fileExt}`;

    const filePath = `gallery/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("gallery-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Image upload error:", uploadError);
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from("gallery-images")
      .getPublicUrl(filePath);

    return {
      url: data.publicUrl,
      path: filePath,
    };
  };

  // =========================
  // DELETE STORAGE IMAGE
  // =========================
  const deleteStorageImage = async (imageUrl) => {
    if (!imageUrl) return;

    try {
      const marker = "/gallery-images/";
      const index = imageUrl.indexOf(marker);

      if (index === -1) return;

      const path = imageUrl.substring(
        index + marker.length
      );

      await supabase.storage
        .from("gallery-images")
        .remove([path]);
    } catch (error) {
      console.error(
        "Storage image delete error:",
        error
      );
    }
  };

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Please enter image title.");
      return;
    }

    if (!editingId && !selectedFile) {
      alert("Please select an image.");
      return;
    }

    try {
      setSaving(true);

      let imageUrl = "";

      // =========================
      // ADD
      // =========================
      if (!editingId) {
        const uploadedImage = await uploadImage(
          selectedFile
        );

        if (!uploadedImage) {
          alert("Image upload failed.");
          return;
        }

        imageUrl = uploadedImage.url;

        const { data, error } = await supabase
          .from("gallery_images")
          .insert([
            {
              title: form.title.trim(),
              category: form.category,
              image_url: imageUrl,
              description: form.description.trim(),
              available: form.available,
            },
          ])
          .select()
          .single();

        if (error) {
          console.error("Gallery insert error:", error);

          await deleteStorageImage(imageUrl);

          alert("Image save failed.");
          return;
        }

        setGallery((prev) => [data, ...prev]);

        alert("Gallery image added successfully ✓");
      }

      // =========================
      // UPDATE
      // =========================
      else {
        const oldItem = gallery.find(
          (item) => item.id === editingId
        );

        imageUrl = oldItem?.image_url || "";

        // If a new image was selected,
        // upload the new image first.
        if (selectedFile) {
          const uploadedImage = await uploadImage(
            selectedFile
          );

          if (!uploadedImage) {
            alert("New image upload failed.");
            return;
          }

          imageUrl = uploadedImage.url;
        }

        const { data, error } = await supabase
          .from("gallery_images")
          .update({
            title: form.title.trim(),
            category: form.category,
            image_url: imageUrl,
            description: form.description.trim(),
            available: form.available,
          })
          .eq("id", editingId)
          .select()
          .single();

        if (error) {
          console.error("Gallery update error:", error);

          // Delete newly uploaded image if database update failed
          if (
            selectedFile &&
            imageUrl &&
            imageUrl !== oldItem?.image_url
          ) {
            await deleteStorageImage(imageUrl);
          }

          alert("Image update failed.");
          return;
        }

        // Delete old Storage image after successful update
        if (
          selectedFile &&
          oldItem?.image_url &&
          oldItem.image_url !== imageUrl
        ) {
          await deleteStorageImage(
            oldItem.image_url
          );
        }

        setGallery((prev) =>
          prev.map((item) =>
            item.id === editingId ? data : item
          )
        );

        alert("Gallery image updated successfully ✓");
      }

      window.dispatchEvent(
        new Event("riyaGalleryUpdated")
      );

      resetForm();
    } catch (error) {
      console.error("Gallery save error:", error);
      alert(
        error.message ||
          "Something went wrong while saving image."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // FORM CHANGE
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // RESET FORM
  // =========================
  const resetForm = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setForm({
      title: "",
      category: "Restaurant",
      description: "",
      available: true,
    });

    setSelectedFile(null);
    setPreviewUrl("");
    setEditingId(null);
    setShowForm(false);
  };

  // =========================
  // EDIT
  // =========================
  const handleEdit = (item) => {
    setEditingId(item.id);

    setForm({
      title: item.title || "",
      category: item.category || "Restaurant",
      description: item.description || "",
      available: item.available !== false,
    });

    setSelectedFile(null);
    setPreviewUrl(item.image_url || "");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================
  // DELETE
  // =========================
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this image?"
    );

    if (!confirmDelete) return;

    try {
      const item = gallery.find(
        (galleryItem) => galleryItem.id === id
      );

      const { error } = await supabase
        .from("gallery_images")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Gallery delete error:", error);
        alert("Image delete failed.");
        return;
      }

      if (item?.image_url) {
        await deleteStorageImage(item.image_url);
      }

      setGallery((prev) =>
        prev.filter((galleryItem) => galleryItem.id !== id)
      );

      window.dispatchEvent(
        new Event("riyaGalleryUpdated")
      );

      alert("Gallery image deleted successfully ✓");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Something went wrong while deleting.");
    }
  };

  // =========================
  // VISIBILITY
  // =========================
  const toggleAvailability = async (
    id,
    currentStatus
  ) => {
    try {
      const newStatus = !currentStatus;

      const { data, error } = await supabase
        .from("gallery_images")
        .update({
          available: newStatus,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error(
          "Visibility update error:",
          error
        );
        alert("Visibility update failed.");
        return;
      }

      setGallery((prev) =>
        prev.map((item) =>
          item.id === id ? data : item
        )
      );

      window.dispatchEvent(
        new Event("riyaGalleryUpdated")
      );
    } catch (error) {
      console.error("Visibility error:", error);
    }
  };

  // =========================
  // CATEGORY COUNT
  // =========================
  const getCategoryCount = (category) => {
    return gallery.filter(
      (item) => item.category === category
    ).length;
  };

  return (
    <div className="admin-gallery-layout">
      {/* SIDEBAR */}
      <aside className="gallery-sidebar">
        <div className="gallery-logo">
          <span>RIYA</span>
          <small>SWEETS ADMIN</small>
        </div>

        <nav className="gallery-nav">
          <button onClick={() => navigate("/admin")}>
            📊 Dashboard
          </button>

          <button
            onClick={() => navigate("/admin/orders")}
          >
            🛒 Orders
          </button>

          <button
            onClick={() => navigate("/admin/users")}
          >
            👥 Users
          </button>

          <button
            onClick={() => navigate("/admin/menu")}
          >
            🍔 Menu
          </button>

          <button className="active">
            🖼️ Gallery
          </button>

          <button
            onClick={() =>
              navigate("/admin/settings")
            }
          >
            ⚙️ Settings
          </button>

          <button
            className="gallery-logout"
            onClick={() => {
              localStorage.removeItem(
                "riyaAdminLoggedIn"
              );
              navigate("/admin/login");
            }}
          >
            🚪 Logout
          </button>
        </nav>

        <div className="gallery-sidebar-bottom">
          <span>RIYA SWEETS</span>
          <small>Admin Panel</small>
        </div>
      </aside>

      {/* MAIN */}
      <main className="admin-gallery-main">
        {/* HEADER */}
        <div className="gallery-header">
          <div>
            <p>ADMIN PANEL</p>
            <h1>Gallery</h1>
            <span>
              Manage restaurant photos and gallery images
            </span>
          </div>

          <button
            className="add-gallery-btn"
            onClick={() => {
              setEditingId(null);

              setForm({
                title: "",
                category: "Restaurant",
                description: "",
                available: true,
              });

              setSelectedFile(null);
              setPreviewUrl("");
              setShowForm(true);
            }}
          >
            + Add Image
          </button>
        </div>

        {/* STATS */}
        <div className="gallery-stats">
          <div className="gallery-stat-card">
            <span>🖼️ Total Images</span>
            <strong>{gallery.length}</strong>
            <small>All gallery images</small>
          </div>

          <div className="gallery-stat-card">
            <span>👁️ Visible</span>
            <strong>
              {
                gallery.filter(
                  (item) => item.available !== false
                ).length
              }
            </strong>
            <small>Shown on public gallery</small>
          </div>

          <div className="gallery-stat-card">
            <span>🙈 Hidden</span>
            <strong>
              {
                gallery.filter(
                  (item) => item.available === false
                ).length
              }
            </strong>
            <small>Currently hidden</small>
          </div>

          <div className="gallery-stat-card">
            <span>🍰 Cakes</span>
            <strong>
              {getCategoryCount("Cakes")}
            </strong>
            <small>Cake photos</small>
          </div>
        </div>

        {/* FORM */}
        {showForm && (
          <section className="gallery-form-section">
            <div className="gallery-form-header">
              <div>
                <p>
                  {editingId
                    ? "EDIT IMAGE"
                    : "NEW IMAGE"}
                </p>

                <h2>
                  {editingId
                    ? "Edit Gallery Image"
                    : "Add Gallery Image"}
                </h2>
              </div>

              <button
                className="close-form-btn"
                onClick={resetForm}
                disabled={saving}
              >
                ✕
              </button>
            </div>

            <form
              className="gallery-form"
              onSubmit={handleSubmit}
            >
              <div className="gallery-form-grid">
                {/* TITLE */}
                <div className="gallery-field">
                  <label>Image Title</label>

                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Example: Birthday Cake"
                    disabled={saving}
                  />
                </div>

                {/* CATEGORY */}
                <div className="gallery-field">
                  <label>Category</label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="Restaurant">
                      Restaurant
                    </option>

                    <option value="Food">
                      Food
                    </option>

                    <option value="Interior">
                      Interior
                    </option>

                    <option value="Events">
                      Events
                    </option>

                    <option value="Cakes">
                      Cakes
                    </option>

                    <option value="Sweets">
                      Sweets
                    </option>

                    <option value="Namkeen">
                      Namkeen
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>
                </div>

                {/* IMAGE UPLOAD */}
                <div className="gallery-field full">
                  <label>
                    {editingId
                      ? "Change Image (Optional)"
                      : "Upload Image"}
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={saving}
                  />

                  <small>
                    JPG, PNG, WEBP • Maximum 5MB
                  </small>
                </div>

                {/* DESCRIPTION */}
                <div className="gallery-field full">
                  <label>Description</label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Write a short description..."
                    rows="3"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* PREVIEW */}
              {previewUrl && (
                <div className="gallery-preview">
                  <span>IMAGE PREVIEW</span>

                  <img
                    src={previewUrl}
                    alt="Preview"
                    onError={(e) => {
                      e.currentTarget.style.display =
                        "none";
                    }}
                  />
                </div>
              )}

              {/* ACTIONS */}
              <div className="gallery-form-actions">
                <button
                  type="button"
                  className="cancel-gallery-btn"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-gallery-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Uploading..."
                    : editingId
                    ? "✓ Update Image"
                    : "+ Upload Image"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* GALLERY LIST */}
        <section className="gallery-list-section">
          <div className="gallery-list-header">
            <div>
              <p>GALLERY</p>
              <h2>All Images</h2>
            </div>

            <button
              onClick={loadGallery}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="gallery-empty">
              <div>⏳</div>
              <h3>Loading Gallery...</h3>
              <p>Please wait.</p>
            </div>
          ) : gallery.length === 0 ? (
            /* EMPTY */
            <div className="gallery-empty">
              <div>🖼️</div>
              <h3>No Images Yet</h3>
              <p>
                Upload your first Riya Sweets image.
              </p>

              <button
                onClick={() => setShowForm(true)}
              >
                + Add Image
              </button>
            </div>
          ) : (
            /* GALLERY GRID */
            <div className="gallery-grid">
              {gallery.map((item) => (
                <div
                  className={`gallery-card ${
                    item.available === false
                      ? "hidden-image"
                      : ""
                  }`}
                  key={item.id}
                >
                  <div className="gallery-image">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/600x400?text=Image+Not+Found";
                      }}
                    />

                    <div className="gallery-category">
                      {item.category}
                    </div>

                    {item.available === false && (
                      <div className="hidden-badge">
                        HIDDEN
                      </div>
                    )}
                  </div>

                  <div className="gallery-card-content">
                    <h3>{item.title}</h3>

                    <p>
                      {item.description ||
                        "No description added."}
                    </p>

                    <div className="gallery-card-footer">
                      <button
                        className={
                          item.available
                            ? "visibility-btn"
                            : "visibility-btn hidden"
                        }
                        onClick={() =>
                          toggleAvailability(
                            item.id,
                            item.available
                          )
                        }
                      >
                        {item.available
                          ? "👁 Visible"
                          : "🙈 Hidden"}
                      </button>

                      <div className="gallery-actions">
                        <button
                          className="edit-gallery-btn"
                          onClick={() =>
                            handleEdit(item)
                          }
                        >
                          ✏️
                        </button>

                        <button
                          className="delete-gallery-btn"
                          onClick={() =>
                            handleDelete(item.id)
                          }
                        >
                          🗑️
                        </button>
                      </div>
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

export default AdminGallery;
