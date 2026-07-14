const mongoose = require('mongoose');

const gameSaveSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    currentLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 4
    },
    xp: {
      type: Number,
      default: 0
    },
    playerHp: {
      type: Number,
      default: 3,
      min: 0,
      max: 3
    },
    currentBattle: {
      monsterId: {
        type: Number,
        default: 0
      },
      monsterHp: {
        type: Number,
        default: 3
      }
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('GameSave', gameSaveSchema);
