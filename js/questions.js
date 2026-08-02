const EASY_LEVEL = 'easy';
const NORMAL_LEVEL = 'normal';
const HARD_LEVEL = 'hard';

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickMultiplicationFactors(level) {
  if (level === EASY_LEVEL) {
    const a = randomInt(1, 5);
    const b = randomInt(1, 5);
    return { a, b };
  }

  if (level === HARD_LEVEL) {
    const a = randomInt(6, 12);
    const b = randomInt(6, 12);
    return { a, b };
  }

  const a = randomInt(3, 10);
  const b = randomInt(3, 10);
  return { a, b };
}

function chooseLevel(state) {
  if (state.reviewCounter >= 3 || state.missCount >= 3) {
    return EASY_LEVEL;
  }

  if (state.consecutiveCorrect >= 4 && state.reviewCounter <= 0) {
    return HARD_LEVEL;
  }

  return NORMAL_LEVEL;
}

export function createAdaptiveQuestionSystem() {
  return {
    missCount: 0,
    consecutiveCorrect: 0,
    reviewCounter: 0,
    currentLevel: NORMAL_LEVEL,
    recordResult(isCorrect) {
      if (isCorrect) {
        this.consecutiveCorrect += 1;
        this.missCount = 0;
        this.reviewCounter = Math.max(0, this.reviewCounter - 1);
      } else {
        this.consecutiveCorrect = 0;
        this.missCount += 1;
        this.reviewCounter += 1;
      }

      if (this.missCount >= 3) {
        this.currentLevel = EASY_LEVEL;
        this.reviewCounter = 3;
      } else if (this.consecutiveCorrect >= 2 && this.reviewCounter <= 0) {
        this.currentLevel = HARD_LEVEL;
      } else if (this.reviewCounter >= 3) {
        this.currentLevel = EASY_LEVEL;
      } else {
        this.currentLevel = NORMAL_LEVEL;
      }
    }
  };
}

export const adaptiveQuestionSystem = createAdaptiveQuestionSystem();

export function resetAdaptiveQuestionSystem() {
  adaptiveQuestionSystem.missCount = 0;
  adaptiveQuestionSystem.consecutiveCorrect = 0;
  adaptiveQuestionSystem.reviewCounter = 0;
  adaptiveQuestionSystem.currentLevel = NORMAL_LEVEL;
}

export function buildQuestion(state) {
  const level = chooseLevel(state);
  const { a, b } = pickMultiplicationFactors(level);
  const answer = a * b;
  return { a, b, answer, level };
}

export function generateQuestion() {
  return buildQuestion(adaptiveQuestionSystem);
}
