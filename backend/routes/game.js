const express = require('express');
const router = express.Router();
const User = require('../models/User');
const GameSave = require('../models/GameSave');

const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || 'teacher123';

// POST - Create new user
router.post('/user/create', async (req, res) => {
  try {
    const { username, classSection, password } = req.body;

    if (!username || username.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    if (!classSection || classSection.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Class section is required'
      });
    }

    if (!password || password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 4 characters'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists. Please login with your password.'
      });
    }

    // Create new user
    const newUser = new User({ username, classSection, password });
    await newUser.save();

    // Create initial game save for this user
    const gameSave = new GameSave({
      userId: newUser._id,
      currentLevel: 0,
      xp: 0,
      playerHp: 3
    });
    await gameSave.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      userId: newUser._id,
      username: newUser.username,
      classSection: newUser.classSection
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST - Login user (verify password)
router.post('/user/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Simple password check (in production, use bcrypt hashing)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      userId: user._id,
      username: user.username,
      classSection: user.classSection
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET - Load game save by username
router.get('/game/load/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const gameSave = await GameSave.findOne({ userId: user._id });
    if (!gameSave) {
      return res.status(404).json({
        success: false,
        message: 'No save data found'
      });
    }

    res.json({
      success: true,
      message: 'Save loaded successfully',
      data: {
        username: user.username,
        currentLevel: gameSave.currentLevel,
        xp: gameSave.xp,
        playerHp: gameSave.playerHp,
        currentBattle: gameSave.currentBattle
      }
    });
  } catch (error) {
    console.error('Error loading game save:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST - Save game progress
router.post('/game/save', async (req, res) => {
  try {
    const { username, currentLevel, xp, playerHp, currentBattle } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const gameSave = await GameSave.findOneAndUpdate(
      { userId: user._id },
      {
        currentLevel,
        xp,
        playerHp,
        currentBattle,
        lastUpdated: new Date()
      },
      { new: true }
    );

    // Update lastPlayed on user
    await User.findByIdAndUpdate(user._id, { lastPlayed: new Date() });

    res.json({
      success: true,
      message: 'Game saved successfully',
      data: {
        currentLevel: gameSave.currentLevel,
        xp: gameSave.xp,
        playerHp: gameSave.playerHp
      }
    });
  } catch (error) {
    console.error('Error saving game:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST - Teacher login
router.post('/teacher/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    // Simple password check
    if (password !== TEACHER_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    res.json({
      success: true,
      message: 'Teacher login successful'
    });
  } catch (error) {
    console.error('Error in teacher login:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET - Get all students (optionally filtered by class)
router.get('/teacher/students', async (req, res) => {
  try {
    const { classSection } = req.query;

    let query = {};
    if (classSection) {
      query.classSection = classSection;
    }

    const users = await User.find(query);
    
    const studentsData = await Promise.all(
      users.map(async (user) => {
        const gameSave = await GameSave.findOne({ userId: user._id });
        return {
          username: user.username,
          classSection: user.classSection,
          currentLevel: gameSave ? gameSave.currentLevel : 0,
          xp: gameSave ? gameSave.xp : 0,
          progress: gameSave ? ((gameSave.currentLevel + 1) / 5 * 100) : 0
        };
      })
    );

    res.json({
      success: true,
      data: studentsData
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET - Get unique class sections
router.get('/teacher/classes', async (req, res) => {
  try {
    const classes = await User.distinct('classSection');
    
    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
