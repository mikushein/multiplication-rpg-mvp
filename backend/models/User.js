const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 1,
      maxlength: 12
    },
    classSection: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20
    },
    password: {
      type: String,
      required: true,
      minlength: 4,
      maxlength: 12
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastPlayed: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
