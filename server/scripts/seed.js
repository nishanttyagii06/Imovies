const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const config = require('../src/config/env');
const User = require('../src/models/User');
const Movie = require('../src/models/Movie');
const Theatre = require('../src/models/Theatre');
const Show = require('../src/models/Show');
const Booking = require('../src/models/Booking');
const Payment = require('../src/models/Payment');
const Review = require('../src/models/Review');
const Watchlist = require('../src/models/Watchlist');
const { generateTicketQRCode } = require('../src/utils/qrCodeService');

// Helper to generate dates (YYYY-MM-DD)
const getDateOffset = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB at:', config.mongoUri);
    await mongoose.connect(config.mongoUri);
    console.log('Clearing existing collections...');

    await Promise.all([
      User.deleteMany({}),
      Movie.deleteMany({}),
      Theatre.deleteMany({}),
      Show.deleteMany({}),
      Booking.deleteMany({}),
      Payment.deleteMany({}),
      Review.deleteMany({}),
      Watchlist.deleteMany({}),
    ]);

    console.log('Creating Admin & Demo Users...');
    // Note: User.pre('save') hashes password automatically
    const admin = await User.create({
      name: 'IMovies Admin',
      username: 'admin',
      email: 'admin@imovies.com',
      password: 'Admin@password123',
      phone: '+91 98765 43210',
      role: 'admin',
    });

    const user = await User.create({
      name: 'Sarah Parker',
      username: 'sarahp',
      email: 'user@imovies.com',
      password: 'User@password123',
      phone: '+91 98111 22334',
      role: 'user',
    });

    console.log('Seeding Movies...');
    await Movie.syncIndexes();
    const movies = await Movie.create([
      {
        title: 'Dune: Part Two',
        description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
        genres: ['Action', 'Adventure', 'Sci-Fi'],
        duration: 166,
        language: 'English',
        releaseDate: new Date('2024-03-01'),
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
        rating: 4.8,
        ratingCount: 1240,
        certificate: 'PG-13',
        status: 'now_showing',
        isFeatured: true,
        director: 'Denis Villeneuve',
        cast: [
          { name: 'Timothée Chalamet', role: 'Paul Atreides' },
          { name: 'Zendaya', role: 'Chani' },
          { name: 'Rebecca Ferguson', role: 'Lady Jessica' },
        ],
      },
      {
        title: 'Oppenheimer',
        description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
        genres: ['Biography', 'Drama', 'History'],
        duration: 180,
        language: 'English',
        releaseDate: new Date('2023-07-21'),
        posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
        rating: 4.9,
        ratingCount: 2310,
        certificate: 'R',
        status: 'now_showing',
        isFeatured: true,
        director: 'Christopher Nolan',
        cast: [
          { name: 'Cillian Murphy', role: 'J. Robert Oppenheimer' },
          { name: 'Emily Blunt', role: 'Katherine Oppenheimer' },
          { name: 'Robert Downey Jr.', role: 'Lewis Strauss' },
        ],
      },
      {
        title: 'Interstellar',
        description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft along with a team of researchers.',
        genres: ['Sci-Fi', 'Adventure', 'Drama'],
        duration: 169,
        language: 'English',
        releaseDate: new Date('2014-11-07'),
        posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1600&auto=format&fit=crop&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
        rating: 4.9,
        ratingCount: 3890,
        certificate: 'PG-13',
        status: 'now_showing',
        isFeatured: true,
        director: 'Christopher Nolan',
        cast: [
          { name: 'Matthew McConaughey', role: 'Cooper' },
          { name: 'Anne Hathaway', role: 'Brand' },
          { name: 'Jessica Chastain', role: 'Murph' },
        ],
      },
      {
        title: 'RRR',
        description: 'A fearless revolutionary and an officer in the British force, who once shared a deep bond, decide to join forces and chart out an inspirational path of freedom against the despotic rulers.',
        genres: ['Action', 'Drama', 'Adventure'],
        duration: 187,
        language: 'Hindi',
        releaseDate: new Date('2022-03-25'),
        posterUrl: 'https://image.tmdb.org/t/p/w780/wE0I6efAW4cDDmZQWtwZMOW44EJ.jpg',
        bannerUrl: 'https://image.tmdb.org/t/p/w1280/i0Y0wP8H6SRgjr6QmuwbtQbS24D.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=f_vbAtFSEc0',
        rating: 4.9,
        ratingCount: 3450,
        certificate: 'U/A',
        status: 'now_showing',
        isFeatured: true,
        director: 'S. S. Rajamouli',
        cast: [
          { name: 'N. T. Rama Rao Jr.', role: 'Komaram Bheem' },
          { name: 'Ram Charan', role: 'Alluri Sitarama Raju' },
          { name: 'Alia Bhatt', role: 'Sita' },
          { name: 'Ajay Devgn', role: 'Venkata Rama Raju' },
        ],
      },
      {
        title: 'Baahubali: The Beginning',
        description: 'In the kingdom of Mahishmati, a young man discovers his royal heritage and must confront his past to claim his rightful place on the throne.',
        genres: ['Action', 'Drama', 'Fantasy'],
        duration: 159,
        language: 'Hindi',
        releaseDate: new Date('2015-07-10'),
        posterUrl: 'https://image.tmdb.org/t/p/w780/j94lTdIjmEqfwJuQ96pCqNxm2HU.jpg',
        bannerUrl: 'https://image.tmdb.org/t/p/w1280/G5dEpF27ooDgua6nnXjGEstiR7.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=sOEg_YZQsTI',
        rating: 4.8,
        ratingCount: 2980,
        certificate: 'U/A',
        status: 'now_showing',
        isFeatured: true,
        director: 'S. S. Rajamouli',
        cast: [
          { name: 'Prabhas', role: 'Amarendra & Mahendra Baahubali' },
          { name: 'Rana Daggubati', role: 'Bhallaladeva' },
          { name: 'Anushka Shetty', role: 'Devasena' },
          { name: 'Tamannaah Bhatia', role: 'Avanthika' },
        ],
      },
      {
        title: 'Dhurandhar',
        description: 'A gripping Hindi spy action-thriller following an elite undercover operation taking on high-stakes national security threats.',
        genres: ['Action', 'Thriller', 'Crime'],
        duration: 155,
        language: 'Hindi',
        releaseDate: new Date('2025-12-05'),
        posterUrl: 'https://image.tmdb.org/t/p/w780/8FHOtUpNIk5ZPEay2N2EY5lrxkv.jpg',
        bannerUrl: 'https://image.tmdb.org/t/p/w1280/snYOXem8pUGOffnLbbGq4aB1pg4.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        rating: 0,
        ratingCount: 0,
        certificate: 'U/A',
        status: 'coming_soon',
        isFeatured: false,
        director: 'Aditya Dhar',
        cast: [
          { name: 'Ranveer Singh', role: 'Hamza Ali Mazari' },
          { name: 'Akshaye Khanna', role: 'Rehman Dakait' },
          { name: 'Sanjay Dutt', role: 'SP Chaudhary Aslam' },
          { name: 'Arjun Rampal', role: 'Major Iqbal' },
          { name: 'R. Madhavan', role: 'Ajay Sanyal' },
        ],
      },
    ]);

    console.log('Seeding Theatres...');
    const theatres = await Theatre.create([
      {
        name: 'PVR ICON: Phoenix Palladium',
        location: {
          address: '462, Senapati Bapat Marg, Lower Parel',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400013',
        },
        contactNumber: '+91 22 4333 9999',
        amenities: ['IMAX with Laser', 'Dolby Atmos', 'Recliner Seats', 'Gourmet Lounge'],
        screens: [
          {
            screenNumber: 1,
            screenName: 'Audi 1 - IMAX Laser',
            capacity: 60,
            seatLayout: {
              totalRows: 6,
              totalCols: 10,
              tiers: [
                { name: 'vip', rows: ['A', 'B'], defaultPrice: 480 },
                { name: 'premium', rows: ['C', 'D'], defaultPrice: 350 },
                { name: 'standard', rows: ['E', 'F'], defaultPrice: 240 },
              ],
            },
          },
          {
            screenNumber: 2,
            screenName: 'Audi 2 - Dolby Atmos 7.1',
            capacity: 50,
            seatLayout: {
              totalRows: 5,
              totalCols: 10,
              tiers: [
                { name: 'premium', rows: ['A', 'B', 'C'], defaultPrice: 300 },
                { name: 'standard', rows: ['D', 'E'], defaultPrice: 200 },
              ],
            },
          },
        ],
      },
      {
        name: 'PVR Director’s Cut: Ambience Mall',
        location: {
          address: 'Ambience Island, NH-8, Vasant Kunj',
          city: 'Delhi NCR',
          state: 'Delhi',
          zipCode: '110070',
        },
        contactNumber: '+91 11 4055 8888',
        amenities: ['Ultra Luxe Recliner', 'Personal Butler', 'Chef Menu', 'Dolby Atmos'],
        screens: [
          {
            screenNumber: 1,
            screenName: 'Screen 1 - Gold Class',
            capacity: 60,
            seatLayout: {
              totalRows: 6,
              totalCols: 10,
              tiers: [
                { name: 'vip', rows: ['A', 'B', 'C'], defaultPrice: 550 },
                { name: 'premium', rows: ['D', 'E', 'F'], defaultPrice: 380 },
              ],
            },
          },
        ],
      },
      {
        name: 'Cinepolis: Forum Shantiniketan',
        location: {
          address: 'Whitefield Main Road, Hoodi',
          city: 'Bengaluru',
          state: 'Karnataka',
          zipCode: '560067',
        },
        contactNumber: '+91 80 6726 1234',
        amenities: ['4DX Motion', 'Dolby Atmos', 'Coffee Bar'],
        screens: [
          {
            screenNumber: 1,
            screenName: 'Screen 1 - 4DX',
            capacity: 60,
            seatLayout: {
              totalRows: 6,
              totalCols: 10,
              tiers: [
                { name: 'vip', rows: ['A', 'B'], defaultPrice: 450 },
                { name: 'premium', rows: ['C', 'D'], defaultPrice: 320 },
                { name: 'standard', rows: ['E', 'F'], defaultPrice: 220 },
              ],
            },
          },
        ],
      },
    ]);

    console.log('Seeding Shows and Seat Layouts...');
    // Generate shows for next 4 days
    const showtimes = ['10:30 AM', '02:00 PM', '06:30 PM', '10:00 PM'];
    const showsToCreate = [];

    const generateSeats = (rowsCount, colsCount, pricing) => {
      const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
      const seats = [];
      for (let r = 0; r < rowsCount; r++) {
        const rowChar = rowLetters[r];
        let tier = 'standard';
        let price = pricing.standard;
        if (r < 2) {
          tier = 'vip';
          price = pricing.vip;
        } else if (r < 4) {
          tier = 'premium';
          price = pricing.premium;
        }

        for (let c = 1; c <= colsCount; c++) {
          seats.push({
            seatNumber: `${rowChar}${c}`,
            row: rowChar,
            col: c,
            tier,
            price,
            status: 'available',
            lockedBy: null,
            lockedUntil: null,
          });
        }
      }
      return seats;
    };

    // For Dune 2 in Mumbai and Bengaluru across today & tomorrow
    for (let dayOffset = 0; dayOffset <= 3; dayOffset++) {
      const showDate = getDateOffset(dayOffset);

      theatres.forEach((theatre) => {
        const screen = theatre.screens[0];
        const pricing = { vip: 450, premium: 320, standard: 220 };

        showtimes.forEach((time, tIdx) => {
          // Alternate across all Now Showing titles (Dune 2, Oppenheimer, Interstellar, RRR, Baahubali)
          const nowShowingList = [movies[0], movies[1], movies[2], movies[3], movies[4]];
          const movie = nowShowingList[(dayOffset + tIdx) % nowShowingList.length];

          showsToCreate.push({
            movie: movie._id,
            theatre: theatre._id,
            screenName: screen.screenName,
            showDate,
            showTime: time,
            pricing,
            seats: generateSeats(6, 10, pricing),
            isActive: true,
          });
        });
      });
    }

    const createdShows = await Show.create(showsToCreate);
    console.log(`Created ${createdShows.length} scheduled shows.`);

    console.log('Creating a confirmed demo booking...');
    const demoShow = createdShows[0];
    // Mark A4 and A5 as booked
    demoShow.seats.forEach((seat) => {
      if (seat.seatNumber === 'A4' || seat.seatNumber === 'A5') {
        seat.status = 'booked';
      }
    });
    await demoShow.save();

    const bookingId = `IMV-${demoShow.showDate.replace(/-/g, '')}-DEMO1`;
    const qrCode = await generateTicketQRCode({
      bookingId,
      verificationToken: 'demo-token-12345',
      showDate: demoShow.showDate,
      showTime: demoShow.showTime,
      seatNumbers: ['A4', 'A5'],
    });

    const booking = await Booking.create({
      bookingId,
      user: user._id,
      show: demoShow._id,
      movieDetails: {
        title: movies[0].title,
        posterUrl: movies[0].posterUrl,
        duration: movies[0].duration,
        language: movies[0].language,
        certificate: movies[0].certificate,
      },
      theatreDetails: {
        name: theatres[0].name,
        screenName: demoShow.screenName,
        city: theatres[0].location.city,
        address: theatres[0].location.address,
      },
      showDetails: {
        showDate: demoShow.showDate,
        showTime: demoShow.showTime,
      },
      seats: [
        { seatNumber: 'A4', tier: 'vip', price: 450 },
        { seatNumber: 'A5', tier: 'vip', price: 450 },
      ],
      subtotal: 900,
      convenienceFee: 60,
      tax: 11,
      totalAmount: 971,
      bookingStatus: 'confirmed',
      paymentStatus: 'completed',
      paymentId: 'MOCK_PAY_DEMO_01',
      qrCode,
      verificationToken: 'demo-token-12345',
    });

    await Payment.create({
      paymentId: 'MOCK_PAY_DEMO_01',
      booking: booking._id,
      user: user._id,
      amount: 971,
      currency: 'INR',
      provider: 'mock',
      orderId: 'MOCK_ORD_DEMO_01',
      status: 'successful',
      paymentMethod: 'mock_instant',
      rawResponse: { note: 'Initial seeded test payment' },
    });

    console.log('Creating Reviews and Watchlist...');
    await Review.create({
      movie: movies[0]._id,
      user: user._id,
      rating: 5,
      comment: 'An absolute cinematic masterpiece! The visuals and sound design in IMAX were breathtaking.',
    });

    await Watchlist.create({
      user: user._id,
      movies: [movies[1]._id, movies[2]._id],
    });

    console.log('✅ Database seeded successfully!');
    console.log('--------------------------------------------------');
    console.log('🔑 Demo Admin Credentials:');
    console.log('   Email:    admin@imovies.com');
    console.log('   Password: Admin@password123');
    console.log('🔑 Demo User Credentials:');
    console.log('   Email:    user@imovies.com');
    console.log('   Password: User@password123');
    console.log('--------------------------------------------------');

    await new Promise((r) => setTimeout(r, 500));
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
