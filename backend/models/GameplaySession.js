const mongoose = require('mongoose');

const gameplaySessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    username: {
      type: String,
      required: true,
      trim: true
    },
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: {
      type: Date,
      default: null
    },
    durationSeconds: {
      type: Number,
      default: 0
    },
    completedLevels: {
      type: Number,
      default: 0
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    incorrectAnswers: {
      type: Number,
      default: 0
    },
    finalLevel: {
      type: Number,
      default: 1
    },
    outcome: {
      type: String,
      enum: ['in-progress', 'won', 'lost', 'paused'],
      default: 'in-progress'
    },
    source: {
      type: String,
      default: 'gameplay'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('GameplaySession', gameplaySessionSchema);
