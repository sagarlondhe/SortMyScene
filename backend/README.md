# Event Ticket Booking System - Backend

REST API for the Event Ticket Booking System built with Node.js, Express, MongoDB, and JWT authentication.

## Architecture

```
backend/
├── config/          # Database configuration
├── controllers/     # HTTP request handlers
├── models/          # Mongoose schemas
├── repositories/    # Data access layer
├── services/        # Business logic
├── middleware/      # Auth & error handling
├── routes/          # API route definitions
├── seed/            # Sample data seeder
├── utils/           # Helpers
└── server.js
```

### Design Decisions

- **MVC + Repository Pattern**: Controllers handle HTTP, services contain business logic, repositories abstract all database operations.
- **Double Booking Prevention**: Atomic `findOneAndUpdate` / conditional `updateMany` on seats (works on standalone MongoDB without a replica set).
- **Reservation Expiration**: Cron job runs every minute to release expired seats and mark reservations as expired.
- **Authentication**: JWT tokens issued on register/login; protected routes require `Authorization: Bearer <token>`.

## Prerequisites

- Node.js 18+
- MongoDB 6+ (local or Atlas)

## Installation

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run seed
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/event_booking` |
| `JWT_SECRET` | Secret for signing JWTs | (required) |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `RESERVATION_DURATION_MINUTES` | Reservation window | `10` |

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/logout` | Yes | Logout |

### Events
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/events` | No | List all events |
| GET | `/api/events/:id` | No | Event details + seats |

### Reservations
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/reserve` | Yes | Reserve seats (10 min) |

### Bookings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/bookings` | Yes | Confirm booking |
| GET | `/api/bookings/my` | Yes | User's bookings |

## Sample Data

After running `npm run seed`:

- **Demo user**: `demo@example.com` / `password123`
- **Event 1**: Summer Music Festival – 100 seats (A1–D25)
- **Event 2**: Tech Conference 2026 – 50 seats (A1–B25)
- **Event 3**: Comedy Night Live – 75 seats (A1–C25)

## Assumptions

- Atomic seat updates are used instead of multi-document transactions so the app runs on a default standalone MongoDB install.
- Logout is client-side token removal; no server-side token blacklist.
- Seat layout is row-based (A1, A2, …) generated at seed time.
