import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/shared/ProtectedRoute';
import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import Checkout from './pages/Checkout';
import Confirmation from './pages/Confirmation';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MyBookings from './pages/MyBookings';
import ListEvent from './pages/ListEvent';
import ResaleMarketplace from './pages/ResaleMarketplace';
import Negotiation from './pages/Negotiation';
import Waitlist from './pages/Waitlist';
import AdminDashboard from './pages/AdminDashboard';
import EventCalendar from './pages/EventCalendar';
import Movies from './pages/Movies';
import MovieDetail from './pages/MovieDetail';
import ScrollToTop from './components/shared/ScrollToTop';
import TicketView from './pages/TicketView';
import useTheme from './store/useTheme';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const { mode } = useTheme();

  return (
    <div className={mode}>
      <Toaster position="top-right" />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Standalone ticket view for QR scans */}
          <Route path="/ticket/:bookingId" element={<TicketView />} />

          <Route element={<AppShell />}>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/confirmation/:bookingId" element={<Confirmation />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/resell-tickets" element={<ResaleMarketplace />} />
            <Route path="/calendar" element={<EventCalendar />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/movie/:id" element={<MovieDetail />} />

            {/* Protected routes — redirect to /auth/login if not signed in */}
            <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
            <Route path="/list-event" element={<ProtectedRoute><ListEvent /></ProtectedRoute>} />
            <Route path="/negotiation/:ticketId" element={<ProtectedRoute><Negotiation /></ProtectedRoute>} />
            <Route path="/waitlist/:eventId" element={<ProtectedRoute><Waitlist /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

