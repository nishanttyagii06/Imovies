import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';

// Client Pages
import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import MovieDetailsPage from './pages/MovieDetailsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ShowtimesPage from './pages/ShowtimesPage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import CheckoutPage from './pages/CheckoutPage';
import ConfirmationPage from './pages/ConfirmationPage';
import ProfilePage from './pages/ProfilePage';
import BookingHistoryPage from './pages/BookingHistoryPage';
import WatchlistPage from './pages/WatchlistPage';
import ReviewsPage from './pages/ReviewsPage';
import TicketVerificationPage from './pages/TicketVerificationPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMovies from './pages/admin/AdminMovies';
import AdminTheatres from './pages/admin/AdminTheatres';
import AdminShows from './pages/admin/AdminShows';
import AdminBookingsUsers from './pages/admin/AdminBookingsUsers';

function App() {
  const [selectedCity, setSelectedCity] = useState('Mumbai');

  return (
    <div className="flex flex-col min-h-screen bg-cinema-darkest text-slate-100">
      <Navbar selectedCity={selectedCity} onSelectCity={setSelectedCity} />

      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/movies/:id" element={<MovieDetailsPage />} />
          <Route path="/movies/:id/reviews" element={<ReviewsPage />} />
          <Route path="/shows/:movieId" element={<ShowtimesPage defaultCity={selectedCity} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-ticket/:token" element={<TicketVerificationPage />} />

          {/* Protected Customer Routes */}
          <Route
            path="/booking/:showId/seats"
            element={
              <ProtectedRoute>
                <SeatSelectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking/:bookingId/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking/:bookingId/confirmation"
            element={
              <ProtectedRoute>
                <ConfirmationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <BookingHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/watchlist"
            element={
              <ProtectedRoute>
                <WatchlistPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="movies" element={<AdminMovies />} />
            <Route path="theatres" element={<AdminTheatres />} />
            <Route path="shows" element={<AdminShows />} />
            <Route path="bookings" element={<AdminBookingsUsers />} />
          </Route>

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
