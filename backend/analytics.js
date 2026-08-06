function calculateAccuracy(correctAnswers, incorrectAnswers) {
  const total = correctAnswers + incorrectAnswers;
  if (!total) {
    return 0;
  }

  return Math.round((correctAnswers / total) * 100);
}

function buildStudentProgressSummary(gameSave = {}, sessions = [], attempts = []) {
  const completedLevels = sessions.reduce((total, session) => total + (session.completedLevels || 0), 0);
  const correctAnswers = attempts.reduce((total, attempt) => total + (attempt.isCorrect ? 1 : 0), 0);
  const incorrectAnswers = attempts.reduce((total, attempt) => total + (!attempt.isCorrect ? 1 : 0), 0);
  const accuracy = calculateAccuracy(correctAnswers, incorrectAnswers);
  const effectiveLevel = Math.max(gameSave.currentLevel || 0, completedLevels, 0);
  const totalLevels = 18;

  return {
    progress: Math.min(100, Math.round((effectiveLevel / totalLevels) * 100)),
    accuracy,
    sessionsPlayed: sessions.length,
    attemptsCount: attempts.length
  };
}

function buildClassOverview(studentSummaries = []) {
  const validSummaries = Array.isArray(studentSummaries) ? studentSummaries : [];
  const totalStudents = validSummaries.length;
  const averageAccuracy = totalStudents
    ? Math.round(validSummaries.reduce((sum, entry) => sum + (Number(entry.accuracy) || 0), 0) / totalStudents)
    : 0;
  const highestProgress = totalStudents
    ? Math.max(...validSummaries.map((entry) => Number(entry.progress) || 0))
    : 0;
  const lowestProgress = totalStudents
    ? Math.min(...validSummaries.map((entry) => Number(entry.progress) || 0))
    : 0;
  const studentsNeedingSupport = validSummaries.filter((entry) => (Number(entry.accuracy) || 0) < 60).length;

  return {
    totalStudents,
    averageAccuracy,
    highestProgress,
    lowestProgress,
    studentsNeedingSupport
  };
}

function buildPhaseMastery(attempts = []) {
  const validAttempts = Array.isArray(attempts) ? attempts : [];
  const buckets = {};

  validAttempts.forEach((attempt) => {
    const phase = Number(attempt.phase) || 1;
    if (!buckets[phase]) {
      buckets[phase] = { phase, correct: 0, total: 0 };
    }
    buckets[phase].total += 1;
    if (attempt.isCorrect) {
      buckets[phase].correct += 1;
    }
  });

  return Object.values(buckets)
    .map((bucket) => ({
      phase: bucket.phase,
      accuracy: bucket.total ? Math.round((bucket.correct / bucket.total) * 100) : 0,
      total: bucket.total
    }))
    .sort((a, b) => a.phase - b.phase);
}

function buildMissedQuestions(attempts = []) {
  const validAttempts = Array.isArray(attempts) ? attempts : [];
  const missed = {};

  validAttempts.forEach((attempt) => {
    if (attempt.isCorrect) {
      return;
    }

    const question = typeof attempt.question === 'string' && attempt.question.trim()
      ? attempt.question.trim()
      : 'Unknown question';

    if (!missed[question]) {
      missed[question] = { question, incorrectCount: 0 };
    }

    missed[question].incorrectCount += 1;
  });

  return Object.values(missed).sort((a, b) => b.incorrectCount - a.incorrectCount).slice(0, 6);
}

module.exports = {
  calculateAccuracy,
  buildStudentProgressSummary,
  buildClassOverview,
  buildPhaseMastery,
  buildMissedQuestions
};
