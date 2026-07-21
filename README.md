# 🎓 AlumniConnect — Professional Campus Alumni & Mentorship Network

A full-stack MERN application connecting university students with alumni for mentorship, mock interviews, and job referrals.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend
```bash
# Install dependencies
npm install

# Copy env file and fill in your values
cp .env.example .env

# Start backend (dev)
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Backend runs on **http://localhost:5000**  
Frontend runs on **http://localhost:5173** (Vite proxies `/api` → backend)

---

## 🌟 Features

| Feature | Description |
|---|---|
| Dual-Role Auth | Student & alumni onboarding with JWT httpOnly cookies |
| Smart Matching | Score-based alumni discovery (skills + industry + interests) |
| Job Board | Alumni post jobs; students apply with pipeline tracking |
| Mentorship | Slot-based session booking with feedback |
| Mock Interviews | Technical/HR/Case Study practice with alumni |
| Referral System | Request and track referrals from alumni |
| Real-time Chat | Socket.io messaging with online presence |
| Notifications | Real-time in-app alerts for all events |
| Events | RSVP-based campus events and webinars |
| Forum | Community discussion boards with upvotes |
| Success Stories | Alumni career journeys with likes |
| Resume Manager | Upload base64 resumes, attach to applications |
| Admin Dashboard | User verification queue + analytics |


---

## 🗂 Project Structure

```
AlumniConnect-holidays/
├── backend/
│   ├── server.js           ← Express + Socket.io entry
│   ├── config/             ← DB, Redis, Swagger, Cloudinary, Logger
│   ├── controllers/        ← 20 business logic modules
│   ├── models/             ← 18 Mongoose schemas
│   ├── routes/             ← 19 API route modules
│   ├── middleware/         ← Auth, RBAC, Validation, Error handling
│   └── utils/              ← Tokens, Matching algorithm, Email & In-app Notifications
├── frontend/
│   └── src/
│       ├── context/        ← AuthContext, SocketContext
│       ├── services/       ← Fetch-based API service layer
│       ├── components/     ← Layout, Auth, UI components
│       ├── pages/          ← Student / Alumni / Admin / Home / Shared pages
│       └── styles/         ← Modular CSS stylesheets
├── tests/                  ← Integration & Jest test suite
└── docker-compose.yml
```

---

## 🔐 Default Roles

| Role | Access |
|---|---|
| `student` | Browse alumni, apply for jobs, book mentorship/interviews |
| `alumni` | Post jobs, manage applications, mentor students |
| `admin` | Verify alumni, manage users, view analytics |

Create an admin user directly in MongoDB:
```js
db.users.updateOne({ email: "admin@college.edu" }, { $set: { role: "admin" } })
```

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose, Socket.io
- **Auth**: JWT + httpOnly cookies, bcryptjs
- **Frontend**: React 18, Vite, React Router v6
- **HTTP**: Native `fetch` API (no Axios)
- **Styling**: Vanilla CSS with custom design system
- **Security**: helmet, express-rate-limit, express-mongo-sanitize
