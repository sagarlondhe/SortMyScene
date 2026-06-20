const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
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
    expires_at: {
      type: Date,
      required: [true, 'Expiration time is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'expired', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid reservation status',
      },
      default: 'active',
      index: true,
    },
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
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
reservationSchema.index({ user_id: 1, status: 1, expires_at: -1 });
reservationSchema.index({ event_id: 1, status: 1 });
reservationSchema.index({ status: 1, expires_at: 1 });

// Virtual for checking if reservation is expired
reservationSchema.virtual('is_expired').get(function () {
  return this.status === 'active' && new Date() > this.expires_at;
});

// Virtual for time remaining
reservationSchema.virtual('time_remaining').get(function () {
  if (this.status !== 'active') return 0;
  const now = new Date();
  const diff = this.expires_at - now;
  return Math.max(0, Math.floor(diff / 1000));
});

// Static method to find and expire reservations
reservationSchema.statics.findAndExpire = async function () {
  const now = new Date();
  return this.updateMany(
    {
      status: 'active',
      expires_at: { $lte: now },
    },
    {
      status: 'expired',
    }
  );
};

// Pre-save hook to validate seat_numbers format
reservationSchema.pre('save', function (next) {
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

module.exports = mongoose.model('Reservation', reservationSchema);
