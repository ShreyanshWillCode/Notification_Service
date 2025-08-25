require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const twilio = require("twilio");
const amqp = require("amqplib");

const app = express();
app.use(cors());
app.use(bodyParser.json());

let notifications = {};

// Dummy user map (extend as needed)
const users = {
  user123: {
    email: process.env.EMAIL_USER,
    phone: process.env.TEST_USER_PHONE,
  },
  shreyansh: {
    email: process.env.EMAIL_USER,
    phone: process.env.TEST_USER_PHONE,
  },
};

// Email setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Twilio setup
const twClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;

let rabbitChannel;
let rabbitAvailable = false;

// Main startup function
async function initRabbitAndServer() {
  // Try to connect to RabbitMQ, but don't fail if unavailable
  try {
    const conn = await amqp.connect(process.env.RABBIT_URL || "amqp://localhost");
    rabbitChannel = await conn.createChannel();
    await rabbitChannel.assertQueue("notifications", { durable: true });
    rabbitAvailable = true;
    console.log("✅ RabbitMQ connected");
  } catch (err) {
    console.warn("⚠️ RabbitMQ connection failed:", err.message);
    console.log("📝 Email/SMS notifications will be processed directly (no queue)");
    rabbitAvailable = false;
  }

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);

    socket.on("register", (userId) => {
      console.log(`👤 User registered: ${userId}`);
      socket.join(userId);
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });

  // Helper function to send email/SMS directly
  async function sendNotificationDirectly(userId, title, message, type) {
    if (!users[userId]) {
      console.warn(`⚠️ Unknown userId: ${userId}`);
      return false;
    }

    try {
      if (type === "email") {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: users[userId].email,
          subject: title,
          text: message,
        });
        console.log(`📧 Email sent directly to ${users[userId].email}`);
        return true;
      } else if (type === "sms") {
        await twClient.messages.create({
          from: TWILIO_PHONE,
          to: users[userId].phone,
          body: `${title}: ${message}`,
        });
        console.log(`📱 SMS sent directly to ${users[userId].phone}`);
        return true;
      }
    } catch (err) {
      console.error(`❌ Failed to send ${type} notification:`, err.message);
      return false;
    }
    return false;
  }

  // Notifications endpoint
  app.post("/notifications", async (req, res) => {
    const { userId, title, message, type } = req.body;

    if (!userId || !title || !message || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!users[userId]) {
      return res.status(404).json({ error: "User not found" });
    }

    notifications[userId] = notifications[userId] || [];
    notifications[userId].push({ title, message, type });

    const payload = { userId, title, message, type };

    if (type === "in-app") {
      io.to(userId).emit("notification", payload);
      console.log(`📢 In-app notification sent to ${userId}`);
    } else {
      // Try to queue the message if RabbitMQ is available
      if (rabbitAvailable && rabbitChannel) {
        try {
          rabbitChannel.sendToQueue(
            "notifications",
            Buffer.from(JSON.stringify(payload)),
            { persistent: true }
          );
          console.log(`📨 Notification queued for ${userId} (${type})`);
        } catch (err) {
          console.error("❌ Failed to queue message:", err.message);
          // Fallback to direct sending
          await sendNotificationDirectly(userId, title, message, type);
        }
      } else {
        // Send directly if RabbitMQ is not available
        await sendNotificationDirectly(userId, title, message, type);
      }
    }

    res.status(202).json({ success: true, queued: type !== "in-app" });
  });

  // Fetch user notifications
  app.get("/users/:id/notifications", (req, res) => {
    res.json(notifications[req.params.id] || []);
  });

  const PORT = process.env.PORT || 4000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

initRabbitAndServer().catch((err) => {
  console.error("❌ Failed to initialize server:", err);
  process.exit(1);
});
