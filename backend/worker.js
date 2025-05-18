require("dotenv").config();
const amqp = require("amqplib");
const nodemailer = require("nodemailer");
const twilio = require("twilio");

// Users must match backend user map
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

// Nodemailer setup
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

async function run() {
  try {
    const conn = await amqp.connect(process.env.RABBIT_URL || "amqp://localhost");
    const ch = await conn.createChannel();
    await ch.assertQueue("notifications", { durable: true });

    console.log("✅ Worker connected to RabbitMQ, waiting for jobs...");

    ch.consume("notifications", async (msg) => {
      if (!msg) return;

      let payload;
      try {
        payload = JSON.parse(msg.content.toString());
      } catch (err) {
        console.error("❌ Invalid message format:", err.message);
        return ch.ack(msg); // Acknowledge bad format to prevent retry loop
      }

      const { userId, title, message, type } = payload;

      if (!userId || !users[userId]) {
        console.warn(`⚠️ Unknown or missing userId: ${userId}`);
        return ch.ack(msg);
      }

      try {
        if (type === "email") {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: users[userId].email,
            subject: title,
            text: message,
          });
          console.log(`📧 Email sent to ${users[userId].email}`);
        } else if (type === "sms") {
          await twClient.messages.create({
            from: TWILIO_PHONE,
            to: users[userId].phone,
            body: `${title}: ${message}`,
          });
          console.log(`📱 SMS sent to ${users[userId].phone}`);
        } else {
          console.warn(`⚠️ Unsupported notification type: ${type}`);
        }

        ch.ack(msg); // Mark message as successfully processed
      } catch (err) {
        console.error("❌ Failed to process notification:", err.message);
        ch.nack(msg, false, true); // Re-queue for retry
      }
    });
  } catch (err) {
    console.error("❌ Worker setup failed:", err.message);
    process.exit(1);
  }
}

run();
