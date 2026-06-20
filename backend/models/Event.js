const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      minlength: [3, 'Event name must be at least 3 characters'],
      maxlength: [200, 'Event name cannot exceed 200 characters'],
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
      minlength: [3, 'Venue must be at least 3 characters'],
      maxlength: [200, 'Venue cannot exceed 200 characters'],
    },
    event_date: {
      type: Date,
      required: [true, 'Event date is required'],
      validate: {
        validator: function (value) {
          return value > new Date();
        },
        message: 'Event date must be in the future',
      },
    },
    total_seats: {
      type: Number,
      required: [true, 'Total seats is required'],
      min: [1, 'Total seats must be at least 1'],
      max: [10000, 'Total seats cannot exceed 10000'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
eventSchema.index({ event_date: 1 });
eventSchema.index({ is_active: 1, is_deleted: 1, event_date: 1 });
eventSchema.index({ name: 'text', venue: 'text', description: 'text' });

// Virtual for checking if event is sold out
eventSchema.virtual('is_sold_out').get(function () {
  return this.available_seats === 0;
});

// Pre-find hook to exclude deleted events
eventSchema.pre(/^find/, function (next) {
  this.where({ is_deleted: false });
  next();
});

module.exports = mongoose.model('Event', eventSchema);
