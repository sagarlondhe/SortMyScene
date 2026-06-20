# Event Ticket Booking System - Frontend

A modern, responsive React.js frontend for a professional event ticket booking system. Built with React 18, Tailwind CSS, and best practices for production-grade applications.

## 🎯 Features

### ✨ Modern UI/UX
- **SaaS-quality design** similar to BookMyShow, Ticketmaster, and Eventbrite
- **Responsive design** for mobile, tablet, and desktop
- **Smooth animations** and transitions
- **Dark mode support** (can be added)
- **Accessibility** compliant (WCAG guidelines)

### 🎭 Core Features
- **Event Listing** - Browse all upcoming events with filters
- **Seat Selection** - Interactive cinema-style seat grid
- **Real-time Booking** - Live seat availability updates
- **Reservations** - 10-minute seat hold with countdown timer
- **Booking Management** - View and manage all bookings
- **User Authentication** - Secure login and registration

### 🛠️ Technical Features
- **Component Architecture** - Reusable, modular components
- **State Management** - Context API with custom hooks
- **Error Boundaries** - Graceful error handling
- **Loading States** - Skeleton loaders and spinners
- **Form Validation** - Client-side validation with feedback
- **API Integration** - Axios with interceptors
- **Mobile-First** - Optimized for all screen sizes

## 📁 Project Structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── common/              # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Alert.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Loaders.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   └── index.js
│   │   ├── features/            # Feature-specific components
│   │   │   ├── Seat.jsx
│   │   │   ├── SeatGrid.jsx
│   │   │   ├── EventCard.jsx
│   │   │   ├── CountdownTimer.jsx
│   │   │   ├── BookingSummary.jsx
│   │   │   └── index.js
│   │   └── ErrorBoundary.jsx
│   ├── pages/                   # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── EventList.jsx
│   │   ├── EventDetail.jsx
│   │   └── MyBookings.jsx
│   ├── context/                 # Context API
│   │   └── AuthContext.jsx
│   ├── services/                # API services
│   │   └── api.js
│   ├── hooks/                   # Custom hooks
│   │   ├── useSeatSelection.js
│   │   ├── useAsync.js
│   │   └── index.js
│   ├── utils/                   # Utility functions
│   │   └── helpers.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
```bash
cp .env.example .env
```

4. **Start development server**
```bash
npm run dev
```

The application will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🎨 Design System

### Colors
- **Primary** (Indigo/Blue): #0284c7
- **Success** (Green): #22c55e
- **Warning** (Amber): #f59e0b
- **Error** (Red): #ef4444
- **Background**: #f8fafc
- **Cards**: #ffffff
- **Text**: #1f2937

### Typography
- **Font Family**: System UI stack
- **Font Sizes**: 12px to 48px (tailwind scale)
- **Font Weights**: 400, 500, 600, 700, 900

### Spacing
- **Consistent spacing** using 4px base unit
- **Max container width**: 80rem (1280px)

### Components

#### Button
```jsx
<Button variant="primary" size="md" isLoading={false}>
  Click Me
</Button>
```

Available variants: `primary`, `secondary`, `success`, `error`, `warning`, `ghost`
Available sizes: `sm`, `md`, `lg`

#### Input
```jsx
<Input
  label="Email"
  type="email"
  error="Invalid email"
  showPasswordToggle={true}
  required
/>
```

#### Alert
```jsx
<Alert
  type="success"
  title="Success"
  message="Operation completed successfully"
  onClose={() => {}}
/>
```

Available types: `success`, `error`, `warning`, `info`

#### Modal
```jsx
<Modal
  isOpen={true}
  onClose={() => {}}
  title="Modal Title"
  footer={<Button>Close</Button>}
>
  Modal content here
</Modal>
```

## 🔐 Authentication

The application uses JWT-based authentication with the following flow:

1. **Register** - Create new account
2. **Login** - Get JWT token
3. **Token Storage** - Stored in localStorage
4. **Auto-Login** - Token persists across sessions
5. **Protected Routes** - Requires authentication for bookings

### Demo Credentials
- Email: `user@example.com`
- Password: `password123`

## 📊 State Management

### Context API
- **AuthContext** - User authentication state and methods
  - `user` - Current logged-in user
  - `token` - JWT token
  - `login()` - Set user and token
  - `logout()` - Clear authentication
  - `isAuthenticated` - Boolean flag

### Custom Hooks
- **useSeatSelection** - Manage selected seats
- **useAsync** - Handle async operations

## 🔄 API Integration

All API calls are made through `services/api.js` which includes:
- Base URL configuration
- Request/response interceptors
- JWT token injection
- Error handling

### API Endpoints
- `GET /api/events` - List all events
- `GET /api/events/:id` - Get event details
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/reserve` - Reserve seats
- `POST /api/bookings` - Confirm booking
- `GET /api/bookings/my` - Get user bookings

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile Features
- Bottom drawer for booking summary
- Touch-friendly buttons
- Optimized seat grid
- Simplified navigation

## ♿ Accessibility

Features implemented:
- Semantic HTML
- ARIA labels and roles
- Focus management
- Keyboard navigation
- Screen reader support
- Proper color contrast
- Form validation feedback

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration flow
- [ ] User login flow
- [ ] Event listing and filtering
- [ ] Seat selection and deselection
- [ ] Reservation creation
- [ ] Booking confirmation
- [ ] Booking history view
- [ ] Responsive on mobile/tablet/desktop
- [ ] Error handling
- [ ] Loading states
- [ ] Form validation

## 🐛 Common Issues

### API Connection Error
- Ensure backend is running on `http://localhost:5000`
- Check `.env` file for correct `VITE_API_URL`

### Styles Not Loading
- Clear node_modules and reinstall
- Clear browser cache
- Restart dev server

### Authentication Issues
- Clear localStorage
- Check if token is valid
- Verify auth endpoint is working

## 📚 Technologies Used

- **React 18** - UI library
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Vite** - Build tool

## 🚀 Performance Optimizations

- Code splitting via React Router
- Lazy loading components
- Image optimization
- Memoization with useMemo/useCallback
- Efficient re-renders
- CSS optimization with Tailwind
- Bundling optimization

## 📝 Best Practices Implemented

- ✅ Component composition
- ✅ Custom hooks
- ✅ Error boundaries
- ✅ Loading states
- ✅ Form validation
- ✅ Accessibility
- ✅ Performance optimization
- ✅ Code organization
- ✅ Error handling
- ✅ Documentation

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is part of SortMyScene - Event Ticket Booking System.

## 📞 Support

For issues or questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ by Senior Frontend Engineer**
