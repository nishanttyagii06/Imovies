const mongoose = require('mongoose');
const Movie = require('../src/models/Movie');
const Theatre = require('../src/models/Theatre');
const Show = require('../src/models/Show');
const Booking = require('../src/models/Booking');
const config = require('../src/config/env');

const replaceMovies = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB.');

    // Drop previous text index if present to apply language_override: 'none'
    try {
      await Movie.collection.dropIndex('title_text_description_text_director_text');
      console.log('Dropped old text index.');
    } catch (e) {
      // Index might not exist or have a different name
    }
    await Movie.syncIndexes();

    // 1. Identify movies to replace (the 3 English movies with no bookings or dependent records)
    const titlesToRemove = [
      'Spider-Man: Across the Spider-Verse',
      'Gladiator II',
      'Avatar: Fire and Ash',
    ];

    console.log('Target movies for replacement:', titlesToRemove);

    // Verify safe deletion
    for (const title of titlesToRemove) {
      const movie = await Movie.findOne({ title });
      if (movie) {
        const bookings = await Booking.countDocuments({ 'movieDetails.title': title });
        const shows = await Show.countDocuments({ movie: movie._id });
        if (bookings > 0 || shows > 0) {
          throw new Error(`Safety check failed: "${title}" has ${bookings} bookings and ${shows} shows!`);
        }
        await Movie.deleteOne({ _id: movie._id });
        console.log(`Safely removed: "${title}"`);
      }
    }

    // 2. Define the three Indian blockbusters
    const indianMovies = [
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
    ];

    const insertedMovies = [];
    for (const mData of indianMovies) {
      let existing = await Movie.findOne({ title: mData.title });
      if (existing) {
        Object.assign(existing, mData);
        await existing.save();
        insertedMovies.push(existing);
        console.log(`Updated existing entry for: "${mData.title}"`);
      } else {
        const created = await Movie.create(mData);
        insertedMovies.push(created);
        console.log(`Created new movie entry: "${mData.title}"`);
      }
    }

    // 3. Generate valid upcoming showtimes for RRR and Baahubali: The Beginning (Now Showing)
    console.log('Generating valid upcoming shows for Now Showing Indian blockbusters...');
    const theatres = await Theatre.find({ isActive: true });
    const nowShowingIndian = insertedMovies.filter((m) => m.status === 'now_showing');

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

    const getDateOffset = (offsetDays) => {
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      return d.toISOString().split('T')[0];
    };

    const showtimes = ['11:00 AM', '03:15 PM', '07:30 PM'];

    for (const movie of nowShowingIndian) {
      for (let dayOffset = 0; dayOffset <= 3; dayOffset++) {
        const showDate = getDateOffset(dayOffset);

        for (const theatre of theatres) {
          const screen = theatre.screens[1] || theatre.screens[0];
          const pricing = { vip: 450, premium: 320, standard: 220 };

          for (const time of showtimes) {
            const existingShow = await Show.findOne({
              theatre: theatre._id,
              screenName: screen.screenName,
              showDate,
              showTime: time,
              isActive: true,
            });

            if (!existingShow) {
              await Show.create({
                movie: movie._id,
                theatre: theatre._id,
                screenName: screen.screenName,
                showDate,
                showTime: time,
                pricing,
                seats: generateSeats(6, 10, pricing),
                isActive: true,
              });
            }
          }
        }
      }
    }

    console.log('✅ Successfully updated catalogue with RRR, Baahubali: The Beginning, and Dhurandhar!');
    const currentList = await Movie.find({}, 'title language status');
    console.log('Current Movies in Database:', currentList);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error during movie replacement:', err);
    process.exit(1);
  }
};

replaceMovies();
