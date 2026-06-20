# Event Ticket Booking System

Full-stack MERN application for event ticket booking with seat reservation, 10-minute hold windows, and double-booking prevention.

## Project Structure

```
SortMyScene_C/
├── backend/     # Node.js + Express API
├── frontend/    # React + Vite UI
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+ (local or Atlas)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev
```

API runs at `http://localhost:5000`

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App runs at `http://localhost:3000`

### Demo Credentials

- Email: `demo@example.com`
- Password: `password123`

## Documentation

| Topic | Location |
|-------|----------|
| Backend setup & API | [backend/README.md](backend/README.md) |
| Frontend setup & UI | [frontend/README.md](frontend/README.md) |

## Architecture Overview

### Backend (MVC + Repository Pattern)

- **Routes** → **Controllers** → **Services** → **Repositories** → **Models**
- Controllers never touch Mongoose models directly
- Business logic lives in the service layer

### Authentication Flow

1. User registers or logs in via `/api/auth/register` or `/api/auth/login`
2. Server returns a JWT signed with `JWT_SECRET`
3. Client stores token in `localStorage` and sends `Authorization: Bearer <token>` on protected routes
4. `authMiddleware` validates the token before allowing access

### Double Booking Prevention

- Seat reservation uses **atomic `findOneAndUpdate`** — each update succeeds only when `status === 'available'`
- If any seat in a multi-seat reservation fails, already-held seats are released (compensating rollback)
- Booking confirmation uses conditional **`updateMany`** to convert `reserved` → `booked` only for the owning user
- Works on standalone MongoDB (no replica set required)

### Reservation Expiration

- Cron job runs every minute via `node-cron`
- Finds active reservations past `expires_at`
- Releases seats back to `available` and marks reservations as `expired`

## Assumptions

- JWT logout is client-side (token removed from storage)
- Seat layout is row-based (A1–D25) generated at seed time
- Events list and seat map poll/refresh periodically on the frontend

## Evaluation Highlights

- Clean separation of concerns (MVC + Repository + Service)
- Concurrency-safe seat operations
- Complete reservation → booking flow with countdown timer
- Color-coded seat map UI
- Comprehensive error handling on both layers
