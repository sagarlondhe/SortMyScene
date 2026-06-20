const mongoose = require('mongoose');

const generateBookingReference = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BK${timestamp}${random}`;
};

const bookingSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true,
    },
    reservation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      required: [true, 'Reservation ID is required'],
      index: true,
    },
    seat_numbers: {
      type: [String],
      required: [true, 'Seat numbers are required'],
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0 && value.length <= 20;
        },
        message: 'Seat numbers must be a non-empty array with maximum 20 seats',
      },
    },
    seat_ids: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    booking_time: {
      type: Date,
      default: Date.now,
      index: true,
    },
    booking_reference: {
      type: String,
      unique: true,
      required: true,
      default: generateBookingReference,
      index: true,
    },
    total_amount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    price_per_seat: {
      type: Number,
      required: [true, 'Price per seat is required'],
      min: [0, 'Price per seat cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['confirmed', 'cancelled', 'refunded'],
        message: '{VALUE} is not a valid booking status',
      },
      default: 'confirmed',
      index: true,
    },
    payment_status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'completed',
    },
    payment_id: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for performance
// Note: booking_reference unique index is already created via `unique: true` on the field above.
bookingSchema.index({ user_id: 1, status: 1, booking_time: -1 });
bookingSchema.index({ event_id: 1, status: 1 });
bookingSchema.index({ booking_time: -1 });

// Virtual for number of seats
bookingSchema.virtual('number_of_seats').get(function () {
  return this.seat_numbers ? this.seat_numbers.length : 0;
});

// Pre-save hook to validate seat_numbers format
bookingSchema.pre('save', function (next) {
  if (this.isModified('seat_numbers')) {
    const invalidSeats = this.seat_numbers.filter(
      (seat) => !/^[A-Z]{1,2}\d{1,3}$/.test(seat)
    );
    if (invalidSeats.length > 0) {
      next(new Error(`Invalid seat numbers: ${invalidSeats.join(', ')}`));
      return;
    }
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
