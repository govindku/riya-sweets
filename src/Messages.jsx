import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import "./Messages.css";
import { supabase } from "./lib/supabase";

function Messages() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Load messages from Supabase
  const loadMessages = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Messages load error:", error);
        setMessages([]);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error("Messages error:", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();

    // Detect new messages from Contact page
    const handleMessagesUpdate = () => {
      loadMessages();
    };

    window.addEventListener(
      "riyaMessagesUpdated",
      handleMessagesUpdate
    );

    return () => {
      window.removeEventListener(
        "riyaMessagesUpdated",
        handleMessagesUpdate
      );
    };
  }, []);

  // Update message status
  const toggleRead = async (id, currentStatus) => {
    const newStatus = currentStatus === "New" ? "Read" : "New";

    const { error } = await supabase
      .from("messages")
      .update({
        status: newStatus,
      })
      .eq("id", id);

    if (error) {
      console.error("Status update error:", error);
      alert("Message status update nahi ho saka.");
      return;
    }

    setMessages((prevMessages) =>
      prevMessages.map((message) =>
        message.id === id
          ? {
              ...message,
              status: newStatus,
            }
          : message
      )
    );
  };

  // Delete message
  const deleteMessage = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this message?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete message error:", error);
      alert("Message delete nahi ho saka.");
      return;
    }

    setMessages((prevMessages) =>
      prevMessages.filter((message) => message.id !== id)
    );

    window.dispatchEvent(new Event("riyaMessagesUpdated"));
  };

  const formatDate = (date) => {
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

  const filteredMessages = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return messages;

    return messages.filter((message) => {
      return (
        message.name?.toLowerCase().includes(query) ||
        message.phone?.toLowerCase().includes(query) ||
        message.email?.toLowerCase().includes(query) ||
        message.subject?.toLowerCase().includes(query) ||
        message.message?.toLowerCase().includes(query)
      );
    });
  }, [messages, search]);

  const newMessages = messages.filter(
    (message) => message.status === "New"
  );

  const readMessages = messages.filter(
    (message) => message.status === "Read"
  );

  return (
    <div className="messages-page">
      {/* Header */}
      <div className="messages-header">
        <div>
          <p>RIYA SWEETS</p>
          <h1>Messages</h1>
        </div>

        <button onClick={loadMessages}>
          🔄 Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="messages-dashboard">
        <div className="message-stat-card">
          <span>📩 Total Messages</span>

          <strong>{messages.length}</strong>

          <small>All customer messages</small>
        </div>

        <div className="message-stat-card">
          <span>🔴 New Messages</span>

          <strong>{newMessages.length}</strong>

          <small>Waiting for response</small>
        </div>

        <div className="message-stat-card">
          <span>✅ Read Messages</span>

          <strong>{readMessages.length}</strong>

          <small>Already viewed</small>
        </div>
      </div>

      {/* Toolbar */}
      <div className="messages-toolbar">
        <div className="messages-count">
          <span>Customer Messages</span>

          <strong>{filteredMessages.length}</strong>
        </div>

        <input
          type="text"
          placeholder="Search name, phone, email, subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Messages */}
      <div className="messages-list">
        {loading ? (
          <div className="no-messages">
            <div>⏳</div>

            <h2>Loading Messages...</h2>

            <p>
              Please wait while we load customer messages.
            </p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="no-messages">
            <div>📭</div>

            <h2>
              {search
                ? "No Matching Messages"
                : "No Messages Found"}
            </h2>

            <p>
              {search
                ? "Try searching with another keyword."
                : "Customer messages will appear here after they contact you."}
            </p>
          </div>
        ) : (
          filteredMessages.map((message) => (
            <div
              className={`message-card ${
                message.status === "New"
                  ? "message-new"
                  : ""
              }`}
              key={message.id}
            >
              {/* Top */}
              <div className="message-card-top">
                <div>
                  <span
                    className={`message-status ${
                      message.status === "New"
                        ? "status-new"
                        : "status-read"
                    }`}
                  >
                    {message.status === "New"
                      ? "● New"
                      : "✓ Read"}
                  </span>

                  <h2>
                    {message.subject || "No Subject"}
                  </h2>
                </div>

                <span className="message-date">
                  {formatDate(message.created_at)}
                </span>
              </div>

              {/* Customer */}
              <div className="message-customer">
                <div className="message-avatar">
                  {message.name
                    ? message.name
                        .charAt(0)
                        .toUpperCase()
                    : "U"}
                </div>

                <div>
                  <h3>
                    {message.name || "Unknown User"}
                  </h3>

                  <p>
                    📱 {message.phone || "No phone"}
                  </p>

                  <p>
                    ✉️ {message.email || "No email"}
                  </p>
                </div>
              </div>

              {/* Message */}
              <div className="message-content">
                <span>MESSAGE</span>

                <p>
                  {message.message ||
                    "No message content"}
                </p>
              </div>

              {/* Actions */}
              <div className="message-actions">
                <button
                  className="read-btn"
                  onClick={() =>
                    toggleRead(
                      message.id,
                      message.status
                    )
                  }
                >
                  {message.status === "New"
                    ? "✓ Mark as Read"
                    : "↩ Mark as New"}
                </button>

                <button
                  className="delete-message-btn"
                  onClick={() =>
                    deleteMessage(message.id)
                  }
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Back */}
      <button
        className="messages-back"
        onClick={() => navigate("/admin")}
      >
        ← Back to Dashboard
      </button>
    </div>
  );
}

export default Messages;
