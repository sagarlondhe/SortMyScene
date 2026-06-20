require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Event = require('../models/Event');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const Reservation = require('../models/Reservation');

const generateSeats = (rows, seatsPerRow) => {
  const seats = [];
  for (const row of rows) {
    for (let i = 1; i <= seatsPerRow; i++) {
      seats.push(`${row}${i}`);
    }
  }
  return seats;
};

const EVENTS = [
  {
    name: 'Summer Music Festival 2026',
    venue: 'Central Park Arena, Mumbai',
    event_date: new Date('2026-08-15T19:00:00'),
    total_seats: 80,
    rows: ['A', 'B', 'C', 'D'],
    seatsPerRow: 20,
    description: 'The biggest outdoor music festival of the year featuring top Bollywood and indie artists.',
    is_active: true,
  },
  {
    name: 'Tech Conference 2026',
    venue: 'Innovation Hall, Bangalore',
    event_date: new Date('2026-09-20T09:00:00'),
    total_seats: 50,
    rows: ['A', 'B', 'C', 'D', 'E'],
    seatsPerRow: 10,
    description: 'A full-day conference featuring talks on AI, cloud computing, and the future of software engineering.',
    is_active: true,
  },
  {
    name: 'Comedy Night Live',
    venue: 'Laugh Factory, Delhi',
    event_date: new Date('2026-06-26T20:30:00'),
    total_seats: 60,
    rows: ['A', 'B', 'C', 'D'],
    seatsPerRow: 15,
    description: "A hilarious evening with India's top stand-up comedians.",
    is_active: true,
  },
  {
    name: 'Classical Dance Showcase',
    venue: 'Nehru Centre Auditorium, Mumbai',
    event_date: new Date('2026-10-05T18:30:00'),
    total_seats: 60,
    rows: ['A', 'B', 'C'],
    seatsPerRow: 20,
    description: 'A mesmerising evening of Bharatanatyam, Kathak, and Odissi performances.',
    is_active: true,
  },
  {
    name: 'Startup Pitch Night',
    venue: 'T-Hub, Hyderabad',
    event_date: new Date('2026-11-12T17:00:00'),
    total_seats: 40,
    rows: ['A', 'B'],
    seatsPerRow: 20,
    description: 'Watch 10 early-stage startups pitch to a panel of top VCs and angel investors.',
    is_active: true,
  },
  {
    name: 'Bollywood Night — Retro Edition',
    venue: 'NSCI Dome, Mumbai',
    event_date: new Date('2026-12-31T21:00:00'),
    total_seats: 100,
    rows: ['A', 'B', 'C', 'D', 'E'],
    seatsPerRow: 20,
    description: 'Ring in the New Year with a Bollywood extravaganza! Live orchestra and celebrity guests.',
    is_active: true,
  },
];

const seed = async () => {
  await connectDB();

  // ── Clear all existing data ───────────────────────────
  console.log('Clearing existing data...');
  await Promise.all([
    Booking.deleteMany({}),
    Reservation.deleteMany({}),
    Seat.deleteMany({}),
    Event.deleteMany({}),
    User.deleteMany({}),
  ]);

  // ── Events + Seats ────────────────────────────────────
  console.log('\nCreating events and seats...');
  for (const eventData of EVENTS) {
    const { rows, seatsPerRow, ...eventFields } = eventData;

    if (rows.length * seatsPerRow !== eventFields.total_seats) {
      throw new Error(
        `Seat mismatch for "${eventFields.name}": ` +
        `${rows.length} × ${seatsPerRow} = ${rows.length * seatsPerRow} ≠ ${eventFields.total_seats}`
      );
    }

    const event = await Event.create(eventFields);
    const seatNumbers = generateSeats(rows, seatsPerRow);
    await Seat.insertMany(
      seatNumbers.map((seat_number) => ({ event_id: event._id, seat_number, status: 'available' }))
    );

    console.log(
      `  ✓ "${event.name}"\n` +
      `      ${rows.length} rows (${rows.join(', ')}) × ${seatsPerRow} = ${seatNumbers.length} seats`
    );
  }

  // ── Done ──────────────────────────────────────────────
  console.log('\n✅ Seed completed successfully!');
  await mongoose.connection.close();
};

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
