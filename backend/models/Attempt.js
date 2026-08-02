const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true
    },
    question: {
      type: String,
      required: true,
      trim: true
    },
    correctAnswer: {
      type: Number,
      required: true
    },
    studentAnswer: {
      type: Number,
      default: null
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    responseTimeSeconds: {
      type: Number,
      default: 0
    },
    phase: {
      type: Number,
      default: 1,
      min: 1
    },
    level: {
      type: Number,
      default: 1,
      min: 1
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attempt', attemptSchema);
