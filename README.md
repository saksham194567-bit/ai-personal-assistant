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
  - **AI Chat**: Authenticated Gemini chat with loading, quota, and provider errors.
  - **Daily Planner**: AI schedule suggestions from tasks and existing planner events, reviewed before saving.
  - **Notes**: AI summaries are shown separately and never replace note text.
  - **Settings & Profile**: Theme colors, notifications, and server-side AI setup guidance.
  - **AuthModal**: Glassmorphic login & registration modal (Email/Password + Google).
- **Offline & Resilient**: Optimistic state with automatic `localStorage` caching and background cloud syncing.

### 2. ⚙️ Backend API (`backend/`)
- **Node.js & Express**: RESTful endpoints on `http://localhost:5000/api`.
- **Routes**:
  - `/api/auth` — Firebase token validation & user synchronization.
  - `/api/tasks` — Task creation, retrieval, updates, and deletion.
  - `/api/notes` — Notes CRUD with search and color tagging.
  - `/api/planner` — Hourly scheduled event management.
  - `/api/chat` — Authenticated Gemini chat, structured planning, and note summarization.
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

### 1. Configure and start the backend

Copy `backend/.env.example` to `backend/.env`, then fill in your own Firebase Admin credentials and Gemini API key. The example contains placeholders only. The AI key is read only by the backend.

```bash
# From the project root:
npm run server
```

Firebase Admin credentials are required for protected API routes; the backend intentionally rejects demo or unsigned tokens. MongoDB is optional for local task/note storage, which already uses browser localStorage.

### 2. Start the Frontend
```bash
# In another terminal:
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## 🔑 Environment Configuration

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` and fill in the placeholders. Keep this file out of Git (the repository ignores it):
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/ai_personal_assistant
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://localhost:5173

# Firebase Service Account (from Firebase Console -> Project Settings -> Service Accounts)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/app/apikey). Google currently lists free usage for some Gemini API models; quotas and eligibility vary by model and can change. If you exceed the free tier or enable paid billing, usage may incur charges. See [current Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing). No new package installation is required for Gemini in this repository.

`AI_PROVIDER` and `GEMINI_MODEL` are backend settings. Gemini is the supported provider in this implementation; changing the model does not require frontend edits. Do not paste a provider key into the Settings page or any `VITE_*` variable.

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
