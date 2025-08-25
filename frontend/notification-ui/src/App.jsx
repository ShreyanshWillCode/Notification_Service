import { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { Mail, MessageCircle, Bell } from "lucide-react";
import "./App.css";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:4000");

export default function App() {
  const [form, setForm] = useState({
    userId: "user123",
    title: "",
    message: "",
    type: "in-app",
  });

  const [queue, setQueue] = useState([]);

  useEffect(() => {
    // Handle page visibility changes to prevent bfcache issues
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Reconnect socket when page becomes visible
        if (!socket.connected) {
          socket.connect();
        }
      }
    };

    // Handle beforeunload to prevent bfcache
    const handleBeforeUnload = () => {
      // Force page reload on navigation to prevent bfcache
      window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
          window.location.reload();
        }
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const userId = "user123";
    socket.emit("register", userId);

    const handleNotification = (data) => {
      if (data.userId && data.userId !== userId) return;
      setQueue((prev) => {
        // Avoid adding duplicate messages
        const isDuplicate = prev.some(
          (item) => item.title === data.title && item.message === data.message && item.type === data.type
        );
        return isDuplicate
          ? prev
          : [...prev, { title: data.title, message: data.message, type: data.type || "in-app" }];
      });
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const apiUrl = `${apiBaseUrl}/notifications`;
    console.log("Sending request to:", apiUrl);

    try {
      await axios.post(apiUrl, form);

      setQueue((prev) => {
        const isDuplicate = prev.some(
          (item) => item.title === form.title && item.message === form.message && item.type === form.type
        );
        return isDuplicate ? prev : [...prev, { title: form.title, message: form.message, type: form.type }];
      });
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      alert("Failed to send notification: " + msg);
    }
  };

  const dismiss = (index) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const getIcon = (type) => {
    switch (type) {
      case "email":
        return <Mail className="h-5 w-5 text-blue-500 mt-1" />;
      case "sms":
        return <MessageCircle className="h-5 w-5 text-blue-500 mt-1" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500 mt-1" />;
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-900 flex items-center justify-center gap-6 p-6 overflow-hidden">
      {/* Admin Panel Styled as iPhone */}
      <div className="relative w-[71.6mm] h-[147.6mm] bg-white border-[6px] border-black rounded-[2.5rem] shadow-lg flex flex-col items-center">
        <div className="w-28 h-5 bg-black rounded-b-2xl absolute top-0 left-1/2 transform -translate-x-1/2" />
        <h2 className="text-lg font-bold text-center text-black mt-6">Send Notification</h2>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 mt-4 px-4">
          <input
            name="userId"
            placeholder="User ID"
            className="w-full p-2 rounded bg-gray-100 text-black border border-gray-300"
            value={form.userId}
            onChange={handleChange}
          />
          <input
            name="title"
            placeholder="Title"
            className="w-full p-2 rounded bg-gray-100 text-black border border-gray-300"
            value={form.title}
            onChange={handleChange}
          />
          <textarea
            name="message"
            placeholder="Message"
            className="w-full p-2 rounded bg-gray-100 text-black border border-gray-300 resize-none"
            rows={3}
            value={form.message}
            onChange={handleChange}
          />
          <select
            name="type"
            className="w-full p-2 rounded bg-gray-100 text-black border border-gray-300"
            value={form.type}
            onChange={handleChange}
          >
            <option value="in-app">In-app</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-800"
          >
            Send
          </button>
        </form>
      </div>

      {/* Notification Panel Styled as iPhone */}
      <div className="relative w-[71.6mm] h-[147.6mm] bg-white border-[6px] border-black rounded-[2.5rem] shadow-lg flex flex-col items-center overflow-hidden">
        <div className="w-28 h-5 bg-black rounded-b-2xl absolute top-0 left-1/2 transform -translate-x-1/2" />
        <h2 className="text-lg font-bold text-center text-black mt-6">Notifications</h2>
        <div className="mt-4 w-full overflow-y-auto px-4 space-y-3 flex-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
          {queue.length === 0 ? (
            <p className="text-gray-500 text-center">No notifications</p>
          ) : (
            queue.map((note, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-3 bg-gray-100 border border-blue-400 rounded relative"
              >
                <button
                  onClick={() => dismiss(i)}
                  className="absolute top-1 right-2 text-blue-500 font-bold"
                  aria-label="Dismiss notification"
                >
                  ×
                </button>
                {getIcon(note.type)}
                <div>
                  <h3 className="font-semibold text-black">{note.title}</h3>
                  <p className="text-sm text-gray-700">{note.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
