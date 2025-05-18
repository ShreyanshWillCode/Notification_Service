# 📢 Notification Service

A full-stack notification system that supports **in-app**, **email**, and **SMS** notifications using:

- **React + Vite** (Frontend)
- **Express + Socket.IO** (Backend)
- **RabbitMQ** for async job processing
- **Nodemailer** for emails
- **Twilio** for SMS

---

## 🚀 Features

- Real-time in-app notifications via WebSocket
- Email & SMS notifications via background job worker
- Message queue using RabbitMQ for decoupled processing
- Admin panel to send notifications to specific users

---

## 📁 Project Structure

## 🧪 Assumptions

- Only known users (e.g., `user123`, `shreyansh`) receive notifications
- RabbitMQ is accessible at `amqp://localhost` by default
- Nodemailer is configured using Gmail SMTP
- All credentials are stored in `.env`

---

## 🔧 Setup Instructions

### 1. **Clone the Repository**

```bash
git clone https://github.com/ShreyanshWillCode/Notification_Service
cd Notification_Service

direct live acces link is available:-https://notification-service-theta.vercel.app/