const express = require('express');
const router = express.Router();
const User = require('../models/User');
const GameSave = require('../models/GameSave');
const Attempt = require('../models/Attempt');
const GameplaySession = require('../models/GameplaySession');
const { buildStudentProgressSummary, buildClassOverview, buildPhaseMastery, buildMissedQuestions } = require('../analytics');

const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || 'teacher123';

// POST - Create new user
router.post('/user/create', async (req, res) => {
  try {
    const { username, classSection, password, fullName, firstName, lastName } = req.body;

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

    const safeFirstName = (firstName || '').trim();
    const safeLastName = (lastName || '').trim();
    const resolvedFullName = (fullName || [safeFirstName, safeLastName].filter(Boolean).join(' ').trim() || username).trim();

    // Create new user
    const newUser = new User({
      username,
      classSection,
      password,
      firstName: safeFirstName,
      lastName: safeLastName,
      fullName: resolvedFullName
    });
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
      classSection: newUser.classSection,
      fullName: newUser.fullName
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
      classSection: user.classSection,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName: user.fullName || user.username
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

// POST - Track gameplay analytics
router.post('/analytics/track', async (req, res) => {
  try {
    const { type, username, sessionId, ...payload } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Analytics type is required'
      });
    }

    const safeUsername = typeof username === 'string' && username.trim() ? username.trim() : 'unknown';

    if (type === 'question_answered') {
      const attempt = new Attempt({
        username: safeUsername,
        question: payload.question || 'unknown',
        correctAnswer: Number(payload.correctAnswer) || 0,
        studentAnswer: payload.studentAnswer != null ? Number(payload.studentAnswer) : null,
        isCorrect: Boolean(payload.isCorrect),
        responseTimeSeconds: Number(payload.responseTimeSeconds) || 0,
        phase: Number(payload.phase) || 1,
        level: Number(payload.level) || 1,
        timestamp: new Date()
      });

      await attempt.save();
      return res.json({ success: true, data: attempt });
    }

    if (type === 'session_started' || type === 'session_completed') {
      const resolvedSessionId = sessionId || `session-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const basePayload = {
        sessionId: resolvedSessionId,
        username: safeUsername,
        source: payload.source || 'gameplay'
      };

      if (type === 'session_started') {
        const session = await GameplaySession.findOneAndUpdate(
          { sessionId: resolvedSessionId },
          {
            ...basePayload,
            startTime: new Date(),
            endTime: null,
            durationSeconds: 0,
            completedLevels: Number(payload.completedLevels) || 0,
            correctAnswers: Number(payload.correctAnswers) || 0,
            incorrectAnswers: Number(payload.incorrectAnswers) || 0,
            finalLevel: Number(payload.finalLevel) || 1,
            outcome: 'in-progress'
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return res.json({ success: true, data: session });
      }

      const session = await GameplaySession.findOneAndUpdate(
        { sessionId: resolvedSessionId },
        {
          ...basePayload,
          endTime: new Date(),
          durationSeconds: Number(payload.durationSeconds) || 0,
          completedLevels: Number(payload.completedLevels) || 0,
          correctAnswers: Number(payload.correctAnswers) || 0,
          incorrectAnswers: Number(payload.incorrectAnswers) || 0,
          finalLevel: Number(payload.finalLevel) || 1,
          outcome: payload.outcome || 'paused'
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.json({ success: true, data: session });
    }

    res.json({ success: true, data: { recorded: true } });
  } catch (error) {
    console.error('Error tracking analytics:', error);
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
        const attempts = await Attempt.find({ username: user.username }).sort({ createdAt: 1 });
        const sessions = await GameplaySession.find({ username: user.username }).sort({ createdAt: 1 });
        const analytics = buildStudentProgressSummary(gameSave || {}, sessions, attempts);

        return {
          username: user.username,
          fullName: user.fullName || user.username,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          classSection: user.classSection,
          currentLevel: gameSave ? gameSave.currentLevel : 0,
          xp: gameSave ? gameSave.xp : 0,
          progress: analytics.progress,
          accuracy: analytics.accuracy,
          sessionsPlayed: analytics.sessionsPlayed,
          attemptsCount: analytics.attemptsCount,
          lastPlayed: user.lastPlayed || null,
          attempts: attempts.map((attempt) => ({
            phase: attempt.phase,
            isCorrect: attempt.isCorrect,
            question: attempt.question
          }))
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

// GET - Get teacher analytics overview
router.get('/teacher/analytics/overview', async (req, res) => {
  try {
    const { classSection } = req.query;

    let query = {};
    if (classSection) {
      query.classSection = classSection;
    }

    const users = await User.find(query).sort({ classSection: 1, username: 1 });
    const studentSummaries = await Promise.all(
      users.map(async (user) => {
        const gameSave = await GameSave.findOne({ userId: user._id });
        const attempts = await Attempt.find({ username: user.username }).sort({ createdAt: 1 });
        const sessions = await GameplaySession.find({ username: user.username }).sort({ createdAt: 1 });
        const analytics = buildStudentProgressSummary(gameSave || {}, sessions, attempts);

        return {
          username: user.username,
          fullName: user.fullName || user.username,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          classSection: user.classSection,
          currentLevel: gameSave ? gameSave.currentLevel : 0,
          xp: gameSave ? gameSave.xp : 0,
          progress: analytics.progress,
          accuracy: analytics.accuracy,
          sessionsPlayed: analytics.sessionsPlayed,
          attemptsCount: analytics.attemptsCount,
          lastPlayed: user.lastPlayed || null,
          attempts: attempts.map((attempt) => ({
            phase: attempt.phase,
            isCorrect: attempt.isCorrect,
            question: attempt.question
          }))
        };
      })
    );

    const overview = buildClassOverview(studentSummaries.map((student) => ({
      progress: student.progress,
      accuracy: student.accuracy,
      sessionsPlayed: student.sessionsPlayed
    })));

    const studentsNeedingSupport = studentSummaries
      .filter((student) => (Number(student.accuracy) || 0) < 60)
      .sort((a, b) => (Number(a.accuracy) || 0) - (Number(b.accuracy) || 0))
      .slice(0, 5);

    const strongestStudents = [...studentSummaries]
      .sort((a, b) => (Number(b.progress) || 0) - (Number(a.progress) || 0))
      .slice(0, 5);

    const phaseMastery = buildPhaseMastery(
      studentSummaries.flatMap((student) => {
        const attempts = student.attempts || [];
        return attempts.map((attempt) => ({
          phase: attempt.phase,
          isCorrect: attempt.isCorrect
        }));
      })
    );

    const missedQuestions = buildMissedQuestions(
      studentSummaries.flatMap((student) => {
        const attempts = student.attempts || [];
        return attempts.map((attempt) => ({
          question: attempt.question,
          isCorrect: attempt.isCorrect
        }));
      })
    );

    res.json({
      success: true,
      data: {
        overview,
        studentsNeedingSupport,
        strongestStudents,
        phaseMastery,
        missedQuestions
      }
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
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

// GET - Leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find({});

    const leaderboard = await Promise.all(
      users.map(async (user) => {
        const gameSave = await GameSave.findOne({ userId: user._id });
        const level = gameSave ? gameSave.currentLevel + 1 : 1;
        const score = gameSave ? gameSave.xp : 0;

        return {
          username: user.username,
          level,
          score
        };
      })
    );

    leaderboard.sort((a, b) => b.score - a.score || a.username.localeCompare(b.username));

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
