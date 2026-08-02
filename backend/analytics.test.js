const assert = require('assert');
const {
  calculateAccuracy,
  buildStudentProgressSummary,
  buildClassOverview,
  buildPhaseMastery,
  buildMissedQuestions
} = require('./analytics');

const accuracy = calculateAccuracy(8, 2);
assert.strictEqual(accuracy, 80, 'accuracy should be 80% for 8 correct and 2 incorrect answers');

const summary = buildStudentProgressSummary(
  { currentLevel: 2 },
  [{ completedLevels: 2 }],
  [{ isCorrect: true }, { isCorrect: false }, { isCorrect: true }]
);

assert.strictEqual(summary.progress, 40, 'progress should reflect the highest completed level');
assert.strictEqual(summary.accuracy, 67, 'accuracy should round to 67% for 2/3 correct');
assert.strictEqual(summary.sessionsPlayed, 1, 'one session should be counted');
assert.strictEqual(summary.attemptsCount, 3, 'three attempts should be counted');

const overview = buildClassOverview([
  { progress: 80, accuracy: 90, sessionsPlayed: 3 },
  { progress: 50, accuracy: 70, sessionsPlayed: 2 },
  { progress: 20, accuracy: 40, sessionsPlayed: 1 }
]);

assert.strictEqual(overview.totalStudents, 3, 'three students should be counted');
assert.strictEqual(overview.averageAccuracy, 67, 'average accuracy should round to 67%');
assert.strictEqual(overview.highestProgress, 80, 'highest progress should be reported');
assert.strictEqual(overview.lowestProgress, 20, 'lowest progress should be reported');
assert.strictEqual(overview.studentsNeedingSupport, 1, 'one student should need support');

const phaseMastery = buildPhaseMastery([
  { phase: 1, isCorrect: true },
  { phase: 1, isCorrect: false },
  { phase: 2, isCorrect: true },
  { phase: 2, isCorrect: true }
]);
assert.strictEqual(phaseMastery[0].accuracy, 50, 'phase 1 accuracy should be 50%');
assert.strictEqual(phaseMastery[1].accuracy, 100, 'phase 2 accuracy should be 100%');

const missedQuestions = buildMissedQuestions([
  { question: '7 × 8', isCorrect: false },
  { question: '7 × 8', isCorrect: false },
  { question: '9 × 4', isCorrect: false },
  { question: '9 × 4', isCorrect: true }
]);
assert.strictEqual(missedQuestions[0].question, '7 × 8', 'the most missed question should be first');
assert.strictEqual(missedQuestions[0].incorrectCount, 2, 'the most missed question should count both misses');

console.log('analytics tests passed');
