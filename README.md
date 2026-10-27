# 🤖 AI Personal Assistant (Full-Stack)

A modern, full-stack AI Personal Assistant built with **React (Vite)**, **Node.js (Express)**, **MongoDB (Mongoose)**, **Firebase Authentication**, and **Google Gemini AI**.

---

## 🏗️ Architecture & Completed Systems

### 1. 🖥️ Frontend (`src/`)
- **React 18 + Vite**: Lightning-fast UI development and build.
- **Components**:
  - **Dashboard**: Productivity overview, task metrics, quick actions.
  - **Task Manager**: High/medium/low priority tasks with filtering and due dates.
  - **Daily Planner**: Time-blocking calendar for scheduling events throughout the day.
  - **Notes**: Color-coded rich notes with instant search and live edit.
  - **AI Chat**: Conversation interface communicating with Google Gemini.
  - **Settings & Profile**: Theme colors, notifications, AI provider configs.
  - **AuthModal**: Glassmorphic login & registration modal (Email/Password + Google).
- **Offline & Resilient**: Optimistic state with automatic `localStorage` caching and background cloud syncing.

### 2. ⚙️ Backend API (`backend/`)
- **Node.js & Express**: RESTful endpoints on `http://localhost:5000/api`.
- **Routes**:
  - `/api/auth` — Firebase token validation & user synchronization.
  - `/api/tasks` — Task creation, retrieval, updates, and deletion.
  - `/api/notes` — Notes CRUD with search and color tagging.
  - `/api/planner` — Hourly scheduled event management.
  - `/api/chat` — Gemini AI proxy keeping API keys private server-side.
  - `/api/user` — User settings and profile updates.
  - `/api/health` — System status and heartbeat.

### 3. 🗄️ Database (`backend/models/`)
- **MongoDB + Mongoose**: Document-based schemas.
- **Models**:
  - `User.js` — Stores Firebase UID, email, display name, avatar, and settings.
  - `Task.js` — User-scoped tasks with priority and due date.
  - `Note.js` — User-scoped notes with title, color, and content.
  - `PlannerEvent.js` — User-scoped hourly events mapped to calendar dates.
  - `ChatMessage.js` — User-scoped conversation history for context preservation.

### 4. 🛡️ Authentication & Security
- **Firebase Auth (Client)**: Email/Password and Google OAuth sign-in.
- **Firebase Admin SDK (Server)**: Verifies Firebase ID tokens via Bearer tokens on protected API endpoints.
- **Helmet**: Secures HTTP response headers against XSS and clickjacking.
- **CORS**: Restricted cross-origin access configured for your Vite frontend.
- **Rate Limiting**: `express-rate-limit` prevents DDoS and AI endpoint abuse.
- **Input Sanitization**: HTML stripping and payload validation to prevent injection attacks.

---

## 🚀 Quick Start Guide

### 1. Start the Backend Server
```bash
# In one terminal:
npm run server
```
Or:
```bash
cd backend
node server.js
```

### 2. Start the Frontend
```bash
# In another terminal:
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## 🔑 Environment Configuration

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` and fill in:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/ai_personal_assistant
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://localhost:5173

# Firebase Service Account (from Firebase Console -> Project Settings -> Service Accounts)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Frontend (`.env`)
```env
VITE_BACKEND_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
```

---

## 🌐 Production Deployment

The frontend is deployed to GitHub Pages by `.github/workflows/deploy-pages.yml`
whenever code is pushed to `main`. The Express API is a separate Render service;
GitHub Pages does not run the backend.

### Deploy the frontend

1. Push this project to a GitHub repository owned by `saksham194567-bit`.
2. In the repository, open **Settings → Pages** and select **GitHub Actions** as
   the build and deployment source.
3. Push to `main` or run the **Deploy to GitHub Pages** workflow manually. The
   site URL will be `https://saksham194567-bit.github.io/ai-personal-assistant/`.
4. In **Settings → Secrets and variables → Actions → Variables**, add
   `VITE_BACKEND_URL` with the deployed API URL followed by `/api` (for example,
   `https://your-service.onrender.com/api`). Add the `VITE_FIREBASE_*` client
   configuration values there as well if you change the Firebase project.
   Re-run the workflow after changing variables.
5. In Firebase Console, add `saksham194567-bit.github.io` to **Authentication →
   Settings → Authorized domains** so sign-in works from the deployed site.

### Deploy the backend

1. Create a MongoDB Atlas database and allow the Render service to connect to it.
2. In Render, create a Blueprint from this repository and use `render.yaml` to
   create the API service. Render will prompt for the environment variables
   marked `sync: false`.
3. Set `MONGO_URI`, `GEMINI_API_KEY`, and the Firebase Admin service-account
   values directly in Render. Never commit `.env` files or service-account keys.
4. Set `FRONTEND_URL` to `https://saksham194567-bit.github.io` (the site origin,
   without the repository path), then add the Render API URL to the GitHub
   `VITE_BACKEND_URL` variable and redeploy the Pages workflow.
