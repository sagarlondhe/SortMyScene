# Event Ticket Booking System - Frontend

React SPA for browsing events, selecting seats, reserving tickets, and confirming bookings.

## Tech Stack

- React 18
- React Router 6
- Axios
- Vite
- Context API (auth state)

## Installation

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |

During development, Vite proxies `/api` requests to `http://localhost:5000`.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Event listing with available seat counts |
| `/events/:id` | Seat selection, reservation, countdown, booking |
| `/login` | User login |
| `/register` | User registration |
| `/bookings` | User's confirmed bookings (protected) |

## UI Features

- **Color-coded seats**: Green (available), Yellow (reserved), Red (booked), Blue (selected)
- **Multi-seat selection** before reserving
- **10-minute countdown timer** after reservation
- **Confirm booking** button during active reservation
- **Error messages** for expired reservations and seat conflicts
- **Auto-refresh** of seat map every 15 seconds

## Assumptions

- User must be logged in to reserve seats (redirects to login)
- Token stored in `localStorage` for session persistence
- Reservation state is held in component state (cleared on page refresh)
