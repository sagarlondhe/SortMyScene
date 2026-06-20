const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true,
    },
    seat_number: {
      type: String,
      required: [true, 'Seat number is required'],
      trim: true,
      validate: {
        validator: function (value) {
          return /^[A-Z]{1,2}\d{1,3}$/.test(value);
        },
        message: 'Seat number must be in format like A1, B12, AB123',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['available', 'reserved', 'booked'],
        message: '{VALUE} is not a valid seat status',
      },
      default: 'available',
      index: true,
    },
    reserved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    reservation_expiry: {
      type: Date,
      default: null,
      index: true,
    },
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    row: {
      type: String,
      trim: true,
    },
    seat_index: {
      type: Number,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for performance
seatSchema.index({ event_id: 1, seat_number: 1 }, { unique: true });
seatSchema.index({ event_id: 1, status: 1 });
seatSchema.index({ status: 1, reservation_expiry: 1 });
seatSchema.index({ event_id: 1, row: 1, seat_index: 1 });
seatSchema.index({ reserved_by: 1, status: 1 });

// Virtual for checking if reservation is expired
seatSchema.virtual('is_reservation_expired').get(function () {
  return this.status === 'reserved' && this.reservation_expiry && new Date() > this.reservation_expiry;
});

// Static method to release expired reservations
seatSchema.statics.releaseExpiredReservations = async function () {
  const now = new Date();
  return this.updateMany(
    {
      status: 'reserved',
      reservation_expiry: { $lte: now },
    },
    {
      status: 'available',
      reserved_by: null,
      reservation_expiry: null,
    }
  );
};

// Pre-save hook to extract row and seat_index from seat_number
seatSchema.pre('save', function (next) {
  if (this.isModified('seat_number')) {
    const match = this.seat_number.match(/^([A-Z]+)(\d+)$/);
    if (match) {
      this.row = match[1];
      this.seat_index = parseInt(match[2], 10);
    }
  }
  next();
});

module.exports = mongoose.model('Seat', seatSchema);
