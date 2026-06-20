const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      validate: {
        validator: function (value) {
          return /^[a-zA-Z0-9_]+$/.test(value);
        },
        message: 'Username can only contain letters, numbers, and underscores',
      },
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (value) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: 'Please provide a valid email address',
      },
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      validate: {
        validator: function (value) {
          // At least one uppercase, one lowercase, one number, one special character
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
        },
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      },
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: '{VALUE} is not a valid role',
      },
      default: 'user',
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    failed_login_attempts: {
      type: Number,
      default: 0,
    },
    lock_until: {
      type: Date,
      default: null,
    },
    last_login: {
      type: Date,
      default: null,
    },
    refresh_tokens: [{
      token: String,
      expires_at: Date,
      created_at: { type: Date, default: Date.now },
    }],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Note: email and username indexes are already created via `index: true` on the field definition above.
// Only add compound or additional indexes here to avoid Mongoose duplicate index warnings.
userSchema.index({ is_active: 1, created_at: -1 });

// Virtual for checking if account is locked
userSchema.virtual('is_locked').get(function () {
  return !!(this.lock_until && this.lock_until > new Date());
});

// Instance method to check if password matches
userSchema.methods.comparePassword = async function (candidatePassword) {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to increment failed login attempts
// Uses updateOne to bypass validators — the password field is already hashed
// and would fail the complexity regex if .save() were used.
userSchema.methods.incrementFailedLogin = function () {
  const updates = { $inc: { failed_login_attempts: 1 } };
  const newCount = this.failed_login_attempts + 1;
  if (newCount >= 5) {
    updates.$set = { lock_until: new Date(Date.now() + 15 * 60 * 1000) };
  }
  return this.constructor.updateOne({ _id: this._id }, updates);
};

// Instance method to reset failed login attempts
// Uses updateOne to bypass validators — same reason as above.
userSchema.methods.resetFailedLogin = function () {
  return this.constructor.updateOne(
    { _id: this._id },
    {
      $set: {
        failed_login_attempts: 0,
        lock_until: null,
        last_login: new Date(),
      },
    }
  );
};

// Static method to find by email or username
userSchema.statics.findByEmailOrUsername = function (identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier },
    ],
  }).select('+password');
};

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);
