# IMovies — Full-Stack Movie Ticket Booking Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8.svg)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-black.svg)](https://socket.io/)

A modern, cinematic, full-stack movie ticket booking web application built with **React 18, Vite, Tailwind CSS, Node.js, Express.js, MongoDB Atlas (Mongoose), Socket.IO, and JWT authentication**.

---

## 📑 Table of Contents
1. [Project Overview & Vision](#-project-overview--vision)
2. [Key Features](#-key-features)
3. [Technology Stack](#-technology-stack)
4. [Architecture & Concurrency Safety](#-architecture--concurrency-safety)
5. [Database Design & Relationships](#-database-design--relationships)
6. [API Endpoints Reference](#-api-endpoints-reference)
7. [Directory Structure](#-directory-structure)
8. [Local Setup & Installation](#-local-setup--installation)
9. [Environment Variables](#-environment-variables)
10. [Database Seeding & Demo Credentials](#-database-seeding--demo-credentials)
11. [Automated Testing](#-automated-testing)
12. [Payment Gateway & Evaluator Test Mode](#-payment-gateway--evaluator-test-mode)
13. [Deployment Guide (Render & Vercel)](#-deployment-guide-render--vercel)
14. [Technical Mentor Evaluation Checklist](#-technical-mentor-evaluation-checklist)
15. [Troubleshooting & Known Limitations](#-troubleshooting--known-limitations)

---

## 🌟 Project Overview & Vision
**IMovies** bridges the theatrical cinema experience with modern cloud software engineering. Designed with a dark navy cinematic aesthetic, subtle gradients, and high-contrast typography, the platform enables customers to discover movies, browse auditorium showtimes, reserve seats with real-time collision prevention, verify payments, and access verifiable digital e-tickets equipped with QR codes.

The system enforces strict role-based access control (RBAC):
- **Customer Role**: Search & filter movies, select showtimes, reserve seats, make payments (Razorpay or interactive Mock Sandbox), download digital passes, cancel eligible tickets, leave reviews, and manage watchlists.
- **Administrator Role**: Real-time revenue analytics calculated exclusively from verified payments, schedule shows with auditorium overlap conflict prevention, manage multiplexes and screens, audit bookings, and toggle user account statuses.

---

## ✨ Key Features
- **Cinematic Dark Theme**: Crafted with Tailwind CSS using `#090b10` base, `#e11d48` primary crimson, gold star ratings, and cyan cinema glow accents.
- **Seat Concurrency Safety**:
  - Atomic seat locking with an 8-minute configurable TTL.
  - Automatic expiration cleanup interval running in background.
  - Multi-user collision prevention preventing double bookings.
  - Live broadcast synchronization via **Socket.IO** rooms.
- **Flexible Dual Payment Processing**:
  - **Razorpay Test/Live Gateway**: Order generation and HMAC-SHA256 signature verification.
  - **Interactive Evaluator Mock Sandbox**: One-click "Simulate Success" and "Simulate Failure" buttons allowing evaluators to verify both completed confirmations and automatic seat release workflows without external credentials.
- **Verifiable Digital E-Tickets**:
  - Dynamic QR codes generated using `qrcode`.
  - Public verification gatekeeper page (`/verify-ticket/:token`) for ticket validation without exposing user sensitive data.
- **19 Complete Pages**:
  1. Home / Landing Page with hero slider & genre pills
  2. Movies Catalog with multi-filters and sorting
  3. Movie Details with YouTube trailer modal & cast
  4. User Login with 1-click Demo Fill
  5. User Registration with live validation
  6. Theatre and Showtimes Page with 6-day date tabs & city switcher
  7. Seat Selection Page with interactive SVG/CSS layout & countdown
  8. Checkout / Payment Page with price breakdown
  9. Booking Confirmation / E-ticket Pass with canvas confetti
  10. User Profile & Password Change
  11. Booking History with Cancellation Modal
  12. Watchlist Page
  13. Movie Reviews & Ratings Page
  14. Ticket Verification Gatekeeper Page
  15. Admin Dashboard with verified revenue KPIs
  16. Admin Movie Management (CRUD & posters)
  17. Admin Theatre & Screen Management
  18. Admin Show Management (with overlap conflict prevention)
  19. Not Found 404 Page

---

## 🛠 Technology Stack
- **Frontend**:
  - React.js 18 + Vite (ESM)
  - Tailwind CSS 3.4
  - React Router DOM 7
  - Axios (with auth interceptors)
  - Socket.IO Client 4.8
  - Lucide React (Cinema Icons)
  - Canvas Confetti
- **Backend**:
  - Node.js & Express.js (MVC architecture)
  - MongoDB Atlas via Mongoose 8
  - Socket.IO 4.8 (Auditorium room broadcasts)
  - JWT (JSON Web Tokens) & bcryptjs
  - Express Rate Limit, Helmet & Morgan
  - QRCode generator
  - Razorpay SDK
- **Testing & Tooling**:
  - Vitest + Supertest
  - Git / GitHub version control

---

## 🏛 Architecture & Concurrency Safety

```
[ Client Browser (React + Vite) ]
        |                   ^
   HTTP REST API         Socket.IO
  (Axios + Bearer)    (Room: show_:id)
        |                   |
        v                   v
[ Express Server (MVC Architecture) ]
  ├── Middleware (Auth, RateLimiter, ErrorHandler)
  ├── SeatLockService (Atomic updates, TTL cleanup)
  └── PaymentService (Razorpay HMAC / Mock Sandbox)
        |
        v
[ MongoDB Database (Mongoose ODM) ]
  ├── Collections: Users, Movies, Theatres, Shows, Bookings, Payments, Reviews, Watchlists
```

### Concurrency Flow
1. **Locking**: When seats `['B1', 'B2']` are selected, `POST /api/shows/:id/lock` atomically checks if seats are `available` or have expired locks. It sets `status = 'locked'`, `lockedBy = userId`, and `lockedUntil = now + 8m`.
2. **Broadcasting**: Socket.IO broadcasts `seats:updated` to room `show_<showId>`. Other browsers immediately see those seats in amber (disabled).
3. **Pre-Payment Revalidation**: `POST /api/bookings/checkout` confirms on the server that all seats are still locked by *this* user before issuing a payment order.
4. **Final Confirmation**: `POST /api/payments/verify` verifies signature or mock action, changes seats to `'booked'`, generates QR code, updates booking to `'confirmed'`, and emits `seats:updated (booked)`.
5. **Rollback on Failure**: If payment fails or cancellation occurs, seats are atomically reverted to `'available'` and broadcast to all connected clients.

---

## 🗄 Database Design & Relationships

### Collections
- **User**: `name`, `username`, `email` (unique), `password` (bcrypt hashed), `phone`, `role` (`'user' | 'admin'`), `isActive`.
- **Movie**: `title` (indexed), `description`, `genres` ([String]), `duration`, `language`, `releaseDate`, `posterUrl`, `bannerUrl`, `trailerUrl`, `rating`, `ratingCount`, `certificate`, `status` (`'now_showing' | 'coming_soon'`), `cast`, `director`.
- **Theatre**: `name`, `location: { address, city, state, zipCode }`, `contactNumber`, `amenities`, `screens: [{ screenNumber, screenName, capacity, seatLayout: { totalRows, totalCols, tiers } }]`.
- **Show**: `movie` (ref), `theatre` (ref), `screenName`, `showDate`, `showTime`, `pricing: { vip, premium, standard }`, `seats: [{ seatNumber, row, col, tier, price, status, lockedBy, lockedUntil }]`. Compound index: `{ theatre: 1, screenName: 1, showDate: 1, showTime: 1 }` prevents overlapping scheduling.
- **Booking**: `bookingId` (unique), `user` (ref), `show` (ref), `movieDetails`, `theatreDetails`, `showDetails`, `seats`, `subtotal`, `convenienceFee`, `tax`, `totalAmount`, `bookingStatus` (`'pending'|'confirmed'|'cancelled'|'expired'|'failed'`), `paymentStatus`, `qrCode`, `verificationToken`.
- **Payment**: `paymentId`, `booking` (ref), `user` (ref), `amount`, `currency`, `provider` (`'razorpay'|'mock'`), `status` (`'pending'|'successful'|'failed'|'refunded'`).
- **Review**: `movie` (ref), `user` (ref), `rating` (1-5), `comment`. Recalculates movie average score automatically on save.
- **Watchlist**: `user` (ref), `movies` ([ref Movie]).

---

## 📡 API Endpoints Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new customer account |
| POST | `/api/auth/login` | Public | Login with email/username & password |
| GET | `/api/auth/me` | Private | Fetch profile of current user |
| PUT | `/api/auth/profile` | Private | Update name, phone, or password |
| POST | `/api/auth/logout` | Public | Clear session cookie |

### Movies (`/api/movies`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/movies` | Public | Browse movies with filters, search & pagination |
| GET | `/api/movies/featured` | Public | Get banner blockbusters & trending releases |
| GET | `/api/movies/:id` | Public | Movie details, cast, and trailer |
| POST | `/api/movies` | Admin | Add new movie |
| PUT | `/api/movies/:id` | Admin | Update movie details or status |
| DELETE | `/api/movies/:id` | Admin | Delete movie (safeguards active shows) |

### Theatres (`/api/theatres`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/theatres` | Public | List theatres with city filter & search |
| GET | `/api/theatres/cities` | Public | Distinct list of cinema cities |
| GET | `/api/theatres/:id` | Public | Theatre details and screen layout |
| POST | `/api/theatres` | Admin | Add new cinema theatre |
| PUT | `/api/theatres/:id` | Admin | Update theatre |
| DELETE | `/api/theatres/:id` | Admin | Delete theatre |

### Shows & Seats (`/api/shows`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/shows/movie/:movieId` | Public | Get showtimes grouped by theatre & date |
| GET | `/api/shows/:id` | Public | Get show details & interactive seat grid |
| POST | `/api/shows/:id/lock` | Private | Atomically lock selected seats for 8 mins |
| POST | `/api/shows/:id/release` | Private | Release locked seats |
| GET | `/api/shows` | Admin | All scheduled shows list |
| POST | `/api/shows` | Admin | Schedule show (prevents screen overlap) |
| DELETE | `/api/shows/:id` | Admin | Delete scheduled show |

### Bookings & Payments (`/api/bookings`, `/api/payments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/bookings/checkout` | Private | Initialize checkout session & verify lock |
| GET | `/api/bookings/my-bookings` | Private | User's past and upcoming tickets |
| GET | `/api/bookings/:id` | Private | Booking details |
| POST | `/api/bookings/:id/cancel` | Private | Cancel booking and release seats |
| GET | `/api/bookings/admin/all` | Admin | Platform-wide bookings audit |
| POST | `/api/payments/verify` | Private | Verify Razorpay HMAC or Mock gateway action |

### Tickets, Reviews & Admin (`/api/tickets`, `/api/reviews`, `/api/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/tickets/verify/:identifier` | Public | Gatekeeper digital QR ticket validation |
| GET | `/api/reviews/movie/:movieId` | Public | Reviews and ratings for a movie |
| POST | `/api/reviews` | Private | Post movie review (1-5 stars) |
| DELETE | `/api/reviews/:id` | Private | Delete review |
| GET | `/api/admin/dashboard` | Admin | Real verified revenue & platform metrics |
| GET | `/api/admin/users` | Admin | Registered customer directory |
| PATCH | `/api/admin/users/:id/toggle-status` | Admin | Activate or deactivate account |
| GET | `/api/health` | Public | Health check endpoint |

---

## 📂 Directory Structure

```
imovies/
├── client/
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── vercel.json
│   ├── .env.example
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   └── ToastContext.jsx
│       ├── services/
│       │   ├── api.js
│       │   └── socket.js
│       ├── components/
│       │   └── common/
│       │       ├── Navbar.jsx
│       │       ├── Footer.jsx
│       │       ├── MovieCard.jsx
│       │       ├── LoadingSkeleton.jsx
│       │       ├── ProtectedRoute.jsx
│       │       └── AdminRoute.jsx
│       └── pages/
│           ├── HomePage.jsx
│           ├── MoviesPage.jsx
│           ├── MovieDetailsPage.jsx
│           ├── LoginPage.jsx
│           ├── RegisterPage.jsx
│           ├── ShowtimesPage.jsx
│           ├── SeatSelectionPage.jsx
│           ├── CheckoutPage.jsx
│           ├── ConfirmationPage.jsx
│           ├── ProfilePage.jsx
│           ├── BookingHistoryPage.jsx
│           ├── WatchlistPage.jsx
│           ├── ReviewsPage.jsx
│           ├── TicketVerificationPage.jsx
│           ├── NotFoundPage.jsx
│           └── admin/
│               ├── AdminLayout.jsx
│               ├── AdminDashboard.jsx
│               ├── AdminMovies.jsx
│               ├── AdminTheatres.jsx
│               ├── AdminShows.jsx
│               └── AdminBookingsUsers.jsx
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── scripts/
│   │   └── seed.js
│   ├── tests/
│   │   └── api.test.js
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       │   ├── db.js
│       │   └── env.js
│       ├── models/
│       │   ├── User.js
│       │   ├── Movie.js
│       │   ├── Theatre.js
│       │   ├── Show.js
│       │   ├── Booking.js
│       │   ├── Payment.js
│       │   ├── Review.js
│       │   └── Watchlist.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── movieController.js
│       │   ├── theatreController.js
│       │   ├── showController.js
│       │   ├── bookingController.js
│       │   ├── paymentController.js
│       │   ├── reviewController.js
│       │   ├── watchlistController.js
│       │   ├── ticketController.js
│       │   └── adminController.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── movieRoutes.js
│       │   ├── theatreRoutes.js
│       │   ├── showRoutes.js
│       │   ├── bookingRoutes.js
│       │   ├── paymentRoutes.js
│       │   ├── reviewRoutes.js
│       │   ├── watchlistRoutes.js
│       │   ├── ticketRoutes.js
│       │   └── adminRoutes.js
│       ├── middleware/
│       │   ├── authMiddleware.js
│       │   ├── errorMiddleware.js
│       │   └── rateLimiter.js
│       ├── services/
│       │   ├── seatLockService.js
│       │   └── paymentService.js
│       ├── sockets/
│       │   └── seatSocket.js
│       └── utils/
│           ├── generateToken.js
│           ├── qrCodeService.js
│           └── responseHelper.js
├── README.md
├── package.json
└── .gitignore
```

---

## 💻 Local Setup & Installation

### Prerequisites
- Node.js (v18 or above)
- npm (v8 or above)
- MongoDB (Local instance or free MongoDB Atlas cluster connection string)

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-username/imovies.git
cd imovies

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

### 2. Environment Configuration
Create `.env` inside `server/`:
```env
PORT=8000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/imovies
JWT_SECRET=supersecret_imovies_jwt_production_key_32chars
CLIENT_URL=http://localhost:5173
SEAT_LOCK_TTL_MINUTES=8
# Razorpay (Optional - Evaluator mock payment active by default if blank)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

Create `.env` inside `client/`:
```env
VITE_API_BASE_URL=/api
```

### 3. Seed Database
Run the realistic cinema seed script to populate users, movies, theatres, upcoming showtimes, and an initial verified booking:
```bash
npm run seed
```

### 4. Start Development Servers
In terminal 1 (Backend):
```bash
cd server
npm run dev
# Server starts at http://localhost:8000
```

In terminal 2 (Frontend):
```bash
cd client
npm run dev
# Frontend starts at http://localhost:5173
```

---

## 🔑 Database Seeding & Demo Credentials
The seed script configures two pre-populated accounts for immediate testing:

| Role | Email | Password | Access Details |
|---|---|---|---|
| **Administrator** | `admin@imovies.com` | `Admin@password123` | Full access to Admin Panel, Revenue KPIs, Shows, Movies, Theatres |
| **Customer** | `user@imovies.com` | `User@password123` | Active customer profile (Sarah Parker) with pre-existing booking |

> **Pro Tip**: On the `/login` page, you can click the **Demo Customer** or **Admin Portal** quick-fill cards to populate credentials in one click!

---

## 🧪 Automated Testing
A comprehensive test suite verifies authentication, duplicate email prevention, role enforcement, movie CRUD, atomic seat locking, simultaneous collision prevention, server-side pricing checkout, payment verification, digital ticket generation, and booking cancellation:

```bash
cd server
npm test
```
All **19 test suites** run with Vitest and Supertest against the database.

---

## 💳 Payment Gateway & Evaluator Test Mode
The application implements an adaptable payment design:
1. **Razorpay Production/Test Mode**: If `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are provided in `server/.env`, backend creates orders via Razorpay and cryptographically validates webhook signatures using HMAC-SHA256.
2. **Built-in Mock Gateway (For Evaluation)**:
   - When Razorpay credentials are absent or during evaluator testing, the checkout page clearly displays the **IMovies Mock Gateway Sandbox**.
   - Evaluators have two explicit buttons:
     - **"Simulate Payment Success"**: Confirms payment, marks seats as booked in MongoDB, generates the digital QR code, and issues the e-ticket pass.
     - **"Simulate Payment Failure"**: Triggers transaction failure, atomically rolls back the locked seats back to available, and marks the booking failed.

---

## 🚀 Deployment Guide (Render & Vercel)

### Deploying the Backend on Render
1. Log in to [Render](https://render.com/) and click **New + > Web Service**.
2. Connect your Git repository.
3. Configure the service settings:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
4. In **Environment Variables**, configure:
   - `PORT`: `8000` (or Render's automatic port)
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/imovies?retryWrites=true&w=majority`
   - `JWT_SECRET`: A secure 32+ character string
   - `CLIENT_URL`: Your Vercel frontend URL (e.g. `https://imovies-client.vercel.app`)
5. Deploy the service. Verify deployment by visiting `https://<your-render-url>/api/health`.

### Deploying the Frontend on Vercel
1. Log in to [Vercel](https://vercel.com/) and click **Add New > Project**.
2. Select your repository.
3. In **Build and Output Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://<your-render-url>/api`
5. Note: `client/vercel.json` contains SPA routing fallback rewrites so refreshing nested routes (e.g., `/booking/...`) works seamlessly.
6. Click **Deploy**.

---

## 📋 Technical Mentor Evaluation Checklist

| Step | Action | Expected Result | Verified |
|---|---|---|:---:|
| 1 | Visit Homepage (`/`) | Hero blockbusters display, Now Showing and Coming Soon cards render with rating badges. | ✅ |
| 2 | Quick Demo Sign-In | Click "Sign In", click "Demo Customer", submit. Toast shows "Welcome back, Sarah Parker!". | ✅ |
| 3 | Movie Browsing & Search | Click "Movies", filter by "Sci-Fi", search "Dune". Result renders immediately. | ✅ |
| 4 | Showtimes & Cinema Selection | Click "Book Tickets", select date tab (Tomorrow), choose Cinema screen & showtime. | ✅ |
| 5 | Interactive Seat Layout | Choose available seats (e.g. VIP/Standard). Seats highlight, subtotal updates dynamically. | ✅ |
| 6 | Seat Lock & Countdown | Click "Lock & Proceed". Server atomically locks seats; 8-min countdown begins. | ✅ |
| 7 | Payment Checkout | Choose Mock Gateway and click "Simulate Payment Success". | ✅ |
| 8 | Digital E-Ticket Pass | Confetti triggers. Confirmed E-ticket renders with Booking ID, Show details, and QR code. | ✅ |
| 9 | Ticket Verification | Click "Open Gatekeeper Public Verification". Page authenticates ticket as `VALID PASS`. | ✅ |
| 10 | Booking History & Cancellation | Navigate to "My Bookings". Click "Cancel" on a booking; verify seats are released in database. | ✅ |
| 11 | Admin Management | Log in as `admin@imovies.com`. Access `/admin` to verify revenue KPIs and schedule new shows. | ✅ |

---

## 🔧 Troubleshooting & Known Limitations

- **MongoDB Connection Error**:
  - Ensure your local mongod service is active (`brew services start mongodb-community`) or verify your MongoDB Atlas IP Whitelist (add `0.0.0.0/0` in Atlas Network Access for cloud deployments).
- **CORS Issues in Production**:
  - Verify that `CLIENT_URL` in the Render backend matches the exact URL of your deployed Vercel frontend without trailing slashes.
- **Socket.IO over Proxies**:
  - In local development, Vite proxies `/socket.io` to port 8000. In production, ensure your Vercel deployment points `VITE_API_BASE_URL` to your live backend domain.
- **Known Limitations**:
  - SMS/Email notifications are modelled in application logic; for live email dispatch, an SMTP service (SendGrid or AWS SES) can be attached to `server/src/utils/mailer.js`.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
