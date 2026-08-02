import { strict as assert } from 'node:assert';
import { createAdaptiveQuestionSystem, buildQuestion } from '../js/questions.js';

const state = createAdaptiveQuestionSystem();

const firstQuestion = buildQuestion(state);
assert.equal(firstQuestion.level, 'normal');

state.recordResult(true);
state.recordResult(true);
state.recordResult(false);
state.recordResult(false);
state.recordResult(false);

const adaptedQuestion = buildQuestion(state);
assert.equal(adaptedQuestion.level, 'easy');

state.recordResult(true);
state.recordResult(true);
state.recordResult(true);

const recoveredQuestion = buildQuestion(state);
assert.equal(recoveredQuestion.level, 'normal');

console.log('questions adaptive tests passed');
