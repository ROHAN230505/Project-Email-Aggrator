# MailFlow — AI-Powered Email Aggregator

A full-stack web app that lets you sign in with your Google account and read your Gmail messages in a beautiful, modern dashboard.

## ✨ Features

- **Sign in with Google** — OAuth2, zero-password, your credentials stay with Google
- **Read real Gmail** — fetches your actual inbox via the Gmail API
- **Thread view** — see full email conversations
- **Reply** — compose and send replies directly from the app
- **Search** — search across your inbox using Gmail search syntax
- **Dark theme** — glassmorphism UI with neon accents and Framer Motion animations
- **Secure** — tokens encrypted at rest, JWT sessions, HTML sanitized before render

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- A Google Cloud project with OAuth2 credentials (see below)

---

### 1. Get Google OAuth2 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth 2.0 Client IDs**
3. Application type: **Web application**
4. Add **Authorized redirect URI**: `http://localhost:8000/auth/google/callback`
5. Copy **Client ID** and **Client Secret**
6. Go to **APIs & Services → Library**, search for and enable **Gmail API**

---

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env and fill in:
#   GOOGLE_CLIENT_ID=...
#   GOOGLE_CLIENT_SECRET=...
#   SECRET_KEY=<run: openssl rand -hex 32>

pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at **http://localhost:8000**
API docs at **http://localhost:8000/docs**

---

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env        # default VITE_API_URL=http://localhost:8000
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

---

### 4. Use the App

1. Open http://localhost:5173
2. Click **Continue with Google**
3. Authorize access to Gmail (read-only)
4. You're redirected back to your inbox with real emails!

---

## 🗂 Project Structure

```
.
├── backend/
│   ├── main.py                    # FastAPI entry point
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── config.py              # Settings (pydantic-settings)
│       ├── database.py            # SQLAlchemy async + SQLite
│       ├── models/user.py         # User model
│       ├── routers/
│       │   ├── auth.py            # Google OAuth2 + JWT
│       │   └── mails.py           # Gmail API proxy
│       ├── services/
│       │   └── gmail_service.py   # Gmail API wrapper
│       └── utils/
│           ├── crypto.py          # Fernet token encryption
│           ├── jwt_utils.py       # JWT sign/verify
│           └── deps.py            # FastAPI auth dependency
└── frontend/
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── App.tsx                # Router + providers
        ├── main.tsx
        ├── index.css              # Tailwind + custom utilities
        ├── types.ts               # Shared TypeScript types
        ├── api/                   # Axios API clients
        ├── contexts/              # AuthContext
        ├── pages/                 # LandingPage, LoginPage, InboxPage, etc.
        └── components/            # Layout, EmailCard, MailDetailPanel
```

---

## 🔐 Security Notes

- OAuth tokens are encrypted with **Fernet** (AES-128-CBC) before storage
- Passwords are never involved — pure OAuth2
- Email HTML bodies are sanitized with **DOMPurify** before rendering
- JWT access tokens expire in 1 hour
- All secrets loaded from `.env` — nothing hardcoded

---

## 🛠 Tech Stack

| Layer     | Technology                                        |
|-----------|---------------------------------------------------|
| Backend   | FastAPI, SQLAlchemy (async), SQLite / PostgreSQL  |
| Auth      | Google OAuth2, JWT (python-jose)                  |
| Gmail     | google-api-python-client                          |
| Frontend  | React 19, TypeScript, Vite                        |
| Styling   | Tailwind CSS v3, Framer Motion                    |
| State     | TanStack Query (React Query), React Context       |
| Security  | DOMPurify, Fernet encryption, bleach             |
