# 📢 Notification Service

A full-stack notification system that supports **in-app**, **email**, and **SMS** notifications using:

- **React + Vite** (Frontend)
- **Express + Socket.IO** (Backend)
- **RabbitMQ** for async job processing (optional)
- **Nodemailer** for emails
- **Twilio** for SMS

---

## 🚀 Features

- Real-time in-app notifications via WebSocket
- Email & SMS notifications via background job worker or direct sending
- Message queue using RabbitMQ for decoupled processing (optional)
- Admin panel to send notifications to specific users
- **Graceful fallback**: Works without RabbitMQ - sends notifications directly

---

## 📁 Project Structure

```
Notification_Service/
├── backend/           # Express + Socket.IO server
├── frontend/          # React + Vite UI
└── DEPLOYMENT.md      # Deployment instructions
```

## 🧪 Assumptions

- Only known users (e.g., `user123`, `shreyansh`) receive notifications
- RabbitMQ is optional - app works without it
- Nodemailer is configured using Gmail SMTP
- All credentials are stored in environment variables

---

## 🔧 Setup Instructions

### 1. **Clone the Repository**

```bash
git clone https://github.com/ShreyanshWillCode/Notification_Service
cd Notification_Service
```

### 2. **Backend Setup**

```bash
cd backend
npm install
```

Create a `.env` file with your credentials (see `DEPLOYMENT.md` for details).

### 3. **Frontend Setup**

```bash
cd frontend/notification-ui
npm install
npm run dev
```

### 4. **Run the Application**

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend (optional)
cd frontend/notification-ui
npm run dev
```

---

## 🚀 Deployment

See `DEPLOYMENT.md` for detailed deployment instructions.

**Live Demo**: https://notification-service-theta.vercel.app/

---

## 🔧 Architecture

- **With RabbitMQ**: Notifications are queued and processed by a background worker
- **Without RabbitMQ**: Notifications are sent directly from the main server
- **In-app notifications**: Always sent immediately via WebSocket
- **Email/SMS**: Queued if RabbitMQ available, sent directly otherwise