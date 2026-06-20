require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Event = require('./models/Event');
const Seat = require('./models/Seat');

const run = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/event_booking';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const userCount = await User.countDocuments();
  console.log(`Users: ${userCount}`);
  const users = await User.find({}, 'username email role');
  console.log(users);

  const eventCount = await Event.countDocuments();
  console.log(`Events: ${eventCount}`);

  const seatCount = await Seat.countDocuments();
  console.log(`Seats: ${seatCount}`);

  await mongoose.connection.close();
};

run().catch(console.error);
