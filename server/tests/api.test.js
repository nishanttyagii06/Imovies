import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import config from '../src/config/env';
import Show from '../src/models/Show';
import Booking from '../src/models/Booking';

describe('IMovies API Comprehensive Test Suite', () => {
  let userToken = '';
  let adminToken = '';
  let testMovieId = '';
  let testTheatreId = '';
  let testShowId = '';
  let activeBookingId = '';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri);
    }
  });

  afterAll(async () => {
    await new Promise((r) => setTimeout(r, 200));
    await mongoose.disconnect();
  });

  // ==========================================
  // 1. AUTHENTICATION & AUTHORIZATION TESTS
  // ==========================================
  describe('Authentication & Authorization', () => {
    const uniqueEmail = `test_${Date.now()}@example.com`;

    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Customer',
          email: uniqueEmail,
          password: 'Password123!',
          phone: '9876500000',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('user');
    });

    it('should prevent duplicate registration with the same email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Guy',
          email: uniqueEmail,
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should fail login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: uniqueEmail,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid credentials/i);
    });

    it('should successfully log in user and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@imovies.com',
          password: 'User@password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      userToken = res.body.token;
    });

    it('should successfully log in admin and enforce role', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@imovies.com',
          password: 'Admin@password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('admin');
      adminToken = res.body.token;
    });

    it('should reject non-admin users from admin routes', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin users into admin routes', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalMovies).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // 2. MOVIE & THEATRE CRUD TESTS
  // ==========================================
  describe('Movie & Theatre Operations', () => {
    it('should fetch list of movies and filters', async () => {
      const res = await request(app).get('/api/movies');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.movies.length).toBeGreaterThan(0);
      testMovieId = res.body.data.movies[0]._id;
    });

    it('should fetch theatres and cinema cities', async () => {
      const res = await request(app).get('/api/theatres');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      testTheatreId = res.body.data[0]._id;
    });

    it('should allow admin to create a new movie with validation', async () => {
      const res = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: `Interstellar 2 Test ${Date.now()}`,
          description: 'A deep space odyssey testing science and emotion.',
          genres: ['Sci-Fi', 'Adventure'],
          duration: 150,
          language: 'English',
          releaseDate: '2026-12-25',
          status: 'coming_soon',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toMatch(/Interstellar 2 Test/);
    });
  });

  // ==========================================
  // 3. SHOWTIMES & SEAT CONCURRENCY TESTS
  // ==========================================
  describe('Showtimes, Seat Locks & Concurrency', () => {
    it('should fetch shows for movie and theatre layout', async () => {
      // Find an active show from DB
      const existingShow = await Show.findOne({ isActive: true });
      expect(existingShow).toBeDefined();
      testShowId = existingShow._id.toString();
      testMovieId = existingShow.movie.toString();

      const res = await request(app).get(`/api/shows/movie/${testMovieId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.theatres.length).toBeGreaterThan(0);
    });

    it('should lock available seats atomically', async () => {
      const res = await request(app)
        .post(`/api/shows/${testShowId}/lock`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          seatNumbers: ['B1', 'B2'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.lockedSeats.length).toBe(2);
    });

    it('should prevent another user from locking already locked seats', async () => {
      // Create another user
      const otherUserLogin = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Concurrent Charlie',
          email: `charlie_${Date.now()}@example.com`,
          password: 'Password123!',
        });
      const otherToken = otherUserLogin.body.token;

      // Attempt to lock B1
      const res = await request(app)
        .post(`/api/shows/${testShowId}/lock`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          seatNumbers: ['B1'],
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already/i);
    });
  });

  // ==========================================
  // 4. BOOKING TOTAL & CHECKOUT TESTS
  // ==========================================
  describe('Booking Workflow & Payment Verification', () => {
    it('should initiate checkout and calculate server-side pricing', async () => {
      const res = await request(app)
        .post('/api/bookings/checkout')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          showId: testShowId,
          seatNumbers: ['B1', 'B2'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking).toBeDefined();
      expect(res.body.data.booking.subtotal).toBeGreaterThan(0);
      expect(res.body.data.booking.convenienceFee).toBe(60); // 2 * 30
      expect(res.body.data.booking.totalAmount).toBeGreaterThan(res.body.data.booking.subtotal);
      activeBookingId = res.body.data.booking.bookingId;
    });

    it('should verify mock payment, confirm booking, and mark seats as booked', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          bookingId: activeBookingId,
          provider: 'mock',
          mockAction: 'success',
          paymentMethod: 'mock_card',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookingStatus).toBe('confirmed');
      expect(res.body.data.paymentStatus).toBe('completed');
      expect(res.body.data.qrCode).toBeDefined();
    });

    it('should verify digital ticket via public verification endpoint', async () => {
      const res = await request(app).get(`/api/tickets/verify/${activeBookingId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.isValid).toBe(true);
      expect(res.body.data.bookingId).toBe(activeBookingId);
      expect(res.body.data.seats).toContain('B1');
    });

    it('should allow user to cancel an eligible confirmed booking and release seats', async () => {
      const res = await request(app)
        .post(`/api/bookings/${activeBookingId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reason: 'Change of schedule plans',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.bookingStatus).toBe('cancelled');
      expect(res.body.data.paymentStatus).toBe('refunded');

      // Verify that B1 is now available again in show document
      const show = await Show.findById(testShowId);
      const b1 = show.seats.find((s) => s.seatNumber === 'B1');
      expect(b1.status).toBe('available');
    });
  });

  // ==========================================
  // 5. WATCHLIST & REVIEW PERMISSIONS
  // ==========================================
  describe('Watchlist and Review Operations', () => {
    it('should add movie to user watchlist and verify', async () => {
      const addRes = await request(app)
        .post(`/api/watchlist/${testMovieId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(addRes.status).toBe(200);

      const checkRes = await request(app)
        .get(`/api/watchlist/check/${testMovieId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(checkRes.status).toBe(200);
      expect(checkRes.body.data.inWatchlist).toBe(true);
    });

    it('should submit a movie review with rating', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          movieId: testMovieId,
          rating: 5,
          comment: 'Spectacular movie! Highly recommended for cinema lovers.',
        });

      // May return 201 or 400 if already reviewed during seed
      if (res.status === 201) {
        expect(res.body.success).toBe(true);
        expect(res.body.data.rating).toBe(5);
      } else {
        expect(res.body.message).toMatch(/already reviewed/i);
      }
    });
  });
});
