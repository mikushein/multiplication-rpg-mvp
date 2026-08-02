import { playerState } from "./player.js";
import { monsters, getBattleMonster } from "./monsters.js";
import { generateQuestion, resetAdaptiveQuestionSystem, adaptiveQuestionSystem } from "./questions.js";
import { resolveTurn } from "./battle.js";
import { loadGame, saveGame, createUser, loginUser, fetchLeaderboard, trackAnalyticsEvent } from "./storage.js";
import {
  setPlayerState,
  setMonsterState,
  updateHud,
  setQuestion,
  setMessage,
  enableInput,
  clearAnswer,
  setBackgroundForLevel,
  stopMonsterSpriteAnimation
} from "./ui.js";

const landingPage = document.getElementById("landing-page");
const studentAuthPage = document.getElementById("student-auth-page");
const postLoginMenuPage = document.getElementById("post-login-menu-page");
const leaderboardPage = document.getElementById("leaderboard-page");
const leaderboardBody = document.getElementById("leaderboard-body");
const leaderboardBackButton = document.getElementById("leaderboard-back-btn");
const creditsPage = document.getElementById("credits-page");
const creditsBackButton = document.getElementById("credits-back-btn");
const gamePage = document.getElementById("game-page");
const teacherLoginPage = document.getElementById("teacher-login-page");
const teacherDashboardPage = document.getElementById("teacher-dashboard-page");
const startGameButton = document.getElementById("start-game-btn");
const teacherEntryButton = document.getElementById("teacher-entry-btn");
const studentLoginTab = document.getElementById("student-login-tab");
const studentCreateTab = document.getElementById("student-create-tab");
const studentLoginForm = document.getElementById("student-login-form");
const studentCreateForm = document.getElementById("student-create-form");
const studentBackButton = document.getElementById("student-back-btn");
const studentAuthMessage = document.getElementById("student-auth-message");
const menuMessage = document.getElementById("menu-message");
const newGameButton = document.getElementById("new-game-btn");
const continueButton = document.getElementById("continue-btn");
const leaderboardButton = document.getElementById("leaderboard-btn");
const creditsButton = document.getElementById("credits-btn");
const exitButton = document.getElementById("exit-btn");
const studentUsernameInput = document.getElementById("student-username-input");
const studentPasswordInput = document.getElementById("student-password-input");
const studentFirstNameInput = document.getElementById("student-first-name-input");
const studentLastNameInput = document.getElementById("student-last-name-input");
const studentNewUsernameInput = document.getElementById("student-new-username-input");
const studentSectionInput = document.getElementById("student-section-input");
const studentNewPasswordInput = document.getElementById("student-new-password-input");
const studentConfirmPasswordInput = document.getElementById("student-confirm-password-input");
const logoutButton = document.getElementById("logout-button");
const answerForm = document.getElementById("answer-form");
const pauseButton = document.getElementById("pause-button");
const pauseMenu = document.getElementById("pause-menu");
const continueGameButton = document.getElementById("continue-game-btn");
const saveGameButton = document.getElementById("save-game-btn");
const exitSaveButton = document.getElementById("exit-save-btn");

let currentMonster = null;
let currentQuestion = null;
let isGameOver = false;
let isPaused = false;
let analyticsSessionId = null;
let analyticsSessionStartTime = null;
let analyticsCorrectAnswers = 0;
let analyticsIncorrectAnswers = 0;
let analyticsSessionCompletedLevels = 0;
let analyticsQuestionCount = 0;
let analyticsBattleCount = 0;
let analyticsLastQuestionStartedAt = null;

function startAnalyticsSession() {
  analyticsSessionId = `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  analyticsSessionStartTime = Date.now();
  analyticsCorrectAnswers = 0;
  analyticsIncorrectAnswers = 0;
  analyticsSessionCompletedLevels = 0;
  analyticsQuestionCount = 0;
  analyticsBattleCount = 0;
  analyticsLastQuestionStartedAt = null;

  trackAnalyticsEvent("session_started", {
    username: playerState.username,
    sessionId: analyticsSessionId,
    level: playerState.levelIndex + 1,
    source: "gameplay"
  });
}

function markAnalyticsSessionOutcome(outcome, extra = {}) {
  if (!analyticsSessionId) return;

  const durationSeconds = Math.max(0, Math.floor((Date.now() - (analyticsSessionStartTime || Date.now())) / 1000));

  trackAnalyticsEvent("session_completed", {
    username: playerState.username,
    sessionId: analyticsSessionId,
    outcome,
    durationSeconds,
    completedLevels: analyticsSessionCompletedLevels,
    correctAnswers: analyticsCorrectAnswers,
    incorrectAnswers: analyticsIncorrectAnswers,
    questionCount: analyticsQuestionCount,
    battleCount: analyticsBattleCount,
    ...extra
  });
}

function trackQuestionAttempt(isCorrect, answerValue, question) {
  const now = Date.now();
  const responseTimeSeconds = analyticsLastQuestionStartedAt
    ? Math.max(0, Math.round((now - analyticsLastQuestionStartedAt) / 1000))
    : 0;

  if (isCorrect) {
    analyticsCorrectAnswers += 1;
  } else {
    analyticsIncorrectAnswers += 1;
  }
  analyticsQuestionCount += 1;

  trackAnalyticsEvent("question_answered", {
    username: playerState.username,
    sessionId: analyticsSessionId,
    question: question ? `${question.a} × ${question.b}` : "unknown",
    correctAnswer: question ? question.answer : null,
    studentAnswer: answerValue,
    isCorrect,
    responseTimeSeconds,
    level: playerState.levelIndex + 1,
    phase: playerState.levelIndex + 1
  });

  analyticsLastQuestionStartedAt = now;
}

function showLandingPage() {
  [landingPage, studentAuthPage, postLoginMenuPage, leaderboardPage, creditsPage, gamePage, teacherLoginPage, teacherDashboardPage].forEach((page) => {
    if (page) page.classList.add("hidden");
  });
  landingPage.classList.remove("hidden");
}

function showStudentAuthPage() {
  [landingPage, studentAuthPage, postLoginMenuPage, leaderboardPage, creditsPage, gamePage, teacherLoginPage, teacherDashboardPage].forEach((page) => {
    if (page) page.classList.add("hidden");
  });
  studentAuthPage.classList.remove("hidden");
  resetStudentAuthForm();
}

function showPostLoginMenuPage() {
  [landingPage, studentAuthPage, postLoginMenuPage, leaderboardPage, creditsPage, gamePage, teacherLoginPage, teacherDashboardPage].forEach((page) => {
    if (page) page.classList.add("hidden");
  });
  postLoginMenuPage.classList.remove("hidden");
}

function showGamePage() {
  [landingPage, studentAuthPage, postLoginMenuPage, leaderboardPage, creditsPage, gamePage, teacherLoginPage, teacherDashboardPage].forEach((page) => {
    if (page) page.classList.add("hidden");
  });
  gamePage.classList.remove("hidden");
}

function showCreditsPage() {
  [landingPage, studentAuthPage, postLoginMenuPage, leaderboardPage, creditsPage, gamePage, teacherLoginPage, teacherDashboardPage].forEach((page) => {
    if (page) page.classList.add("hidden");
  });
  creditsPage.classList.remove("hidden");
}

function setStudentMode(mode) {
  if (mode === "create") {
    studentLoginForm.classList.add("hidden");
    studentCreateForm.classList.remove("hidden");
    studentLoginTab.classList.remove("active");
    studentCreateTab.classList.add("active");
  } else {
    studentLoginForm.classList.remove("hidden");
    studentCreateForm.classList.add("hidden");
    studentLoginTab.classList.add("active");
    studentCreateTab.classList.remove("active");
  }
}

function resetStudentAuthForm() {
  studentUsernameInput.value = "";
  studentPasswordInput.value = "";
  studentFirstNameInput.value = "";
  studentLastNameInput.value = "";
  studentNewUsernameInput.value = "";
  studentSectionInput.value = "";
  studentNewPasswordInput.value = "";
  studentConfirmPasswordInput.value = "";
  studentAuthMessage.textContent = "";
  setStudentMode("login");
}

function setPauseMenu(open) {
  if (pauseMenu) {
    pauseMenu.classList.toggle("hidden", !open);
  }

  if (pauseButton) {
    pauseButton.textContent = open ? "Resume" : "Pause";
  }

  isPaused = open;

  if (open) {
    enableInput(false);
    return;
  }

  if (!isGameOver) {
    enableInput(true);
  }
}

function openPauseMenu() {
  if (isGameOver) return;
  setPauseMenu(true);
}

function closePauseMenu() {
  setPauseMenu(false);
}

function startBattleForCurrentLevel() {
  const battleLevel = getBattleMonster(playerState.levelIndex);
  currentMonster = { ...battleLevel };
  currentMonster.hp = battleLevel.hp;
  currentQuestion = generateQuestion();
  analyticsBattleCount += 1;
  analyticsLastQuestionStartedAt = Date.now();
  setBackgroundForLevel(battleLevel);
  updateHud(playerState, currentMonster);
  setQuestion(`What is ${currentQuestion.a} × ${currentQuestion.b}?`);
  setMessage(`${currentMonster.name} appears!`);
  setMonsterState(currentMonster, "idle");
  setPauseMenu(false);
  enableInput(true);
  clearAnswer();

  trackAnalyticsEvent("battle_started", {
    username: playerState.username,
    sessionId: analyticsSessionId,
    monster: currentMonster.name,
    level: playerState.levelIndex + 1,
    phase: playerState.levelIndex + 1,
    battleNumber: analyticsBattleCount
  });
}

async function beginStudentSession(username, classSection, password, isNewPlayer) {
  playerState.username = username;

  if (!isNewPlayer) {
    const savedGame = await loadGame(username);
    if (savedGame) {
      playerState.levelIndex = savedGame.currentLevel;
      playerState.xp = savedGame.xp;
      playerState.hp = savedGame.playerHp || 10;
    }
  } else {
    playerState.hp = 10;
    playerState.levelIndex = 0;
    playerState.xp = 0;
  }

  isGameOver = false;
  menuMessage.textContent = "";
  if (!analyticsSessionId) {
    startAnalyticsSession();
  }
  showPostLoginMenuPage();
  setPlayerState("idle");
  setMessage(`${username} (${classSection}), choose your path.`);
  await saveGame(playerState);
}

function startFreshGame() {
  resetAdaptiveQuestionSystem();
  playerState.hp = 10;
  playerState.levelIndex = 0;
  playerState.xp = 0;
  startAnalyticsSession();
  showGamePage();
  startBattleForCurrentLevel();
  setMessage(`${playerState.username || "Player"} begins a new adventure!`);
}

function continueCurrentGame() {
  if (!analyticsSessionId) {
    startAnalyticsSession();
  }
  showGamePage();
  startBattleForCurrentLevel();
  setMessage(`${playerState.username || "Player"} resumes the adventure.`);
}

async function saveAndReturnToMenu() {
  await saveGame(playerState);
  markAnalyticsSessionOutcome("paused", { source: "menu" });
  closePauseMenu();
  showPostLoginMenuPage();
  setMessage(`${playerState.username || "Player"} returned to the adventure menu.`);
}

function showMenuMessage(text) {
  if (menuMessage) {
    menuMessage.textContent = text;
  }
}

function showLeaderboardPage() {
  [landingPage, studentAuthPage, postLoginMenuPage, leaderboardPage, creditsPage, gamePage, teacherLoginPage, teacherDashboardPage].forEach((page) => {
    if (page) page.classList.add("hidden");
  });

  if (leaderboardPage) {
    leaderboardPage.classList.remove("hidden");
  }
}

async function renderLeaderboard() {
  if (!leaderboardBody) return;

  leaderboardBody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';

  const entries = await fetchLeaderboard();
  if (!entries.length) {
    leaderboardBody.innerHTML = '<tr><td colspan="4">No scores yet.</td></tr>';
    return;
  }

  leaderboardBody.innerHTML = entries.map((entry, index) => {
    const level = Math.max(1, entry.level || 1);
    const score = Math.max(0, entry.score || entry.xp || 0);
    return `
      <tr>
        <td>#${index + 1}</td>
        <td>${entry.username}</td>
        <td>${level}</td>
        <td>${score}</td>
      </tr>
    `;
  }).join("");
}

async function handleStudentLogin(event) {
  event.preventDefault();
  const username = studentUsernameInput.value.trim();
  const password = studentPasswordInput.value.trim();

  if (!username) {
    studentAuthMessage.textContent = "❌ Please enter your username.";
    return;
  }
  if (!password) {
    studentAuthMessage.textContent = "❌ Please enter your password.";
    return;
  }

  const userResult = await loginUser(username, password);
  if (!userResult) {
    studentAuthMessage.textContent = "❌ Username or password is incorrect.";
    return;
  }

  await beginStudentSession(username, userResult.classSection || "", password, false);
}

async function handleStudentCreate(event) {
  event.preventDefault();
  const firstName = studentFirstNameInput.value.trim();
  const lastName = studentLastNameInput.value.trim();
  const username = studentNewUsernameInput.value.trim();
  const classSection = studentSectionInput.value.trim();
  const password = studentNewPasswordInput.value.trim();
  const confirmPassword = studentConfirmPasswordInput.value.trim();

  if (!firstName || !lastName) {
    studentAuthMessage.textContent = "❌ Please enter your first and last name.";
    return;
  }
  if (!username) {
    studentAuthMessage.textContent = "❌ Please choose a username.";
    return;
  }
  if (!classSection) {
    studentAuthMessage.textContent = "❌ Please enter your section.";
    return;
  }
  if (!password || password.length < 4) {
    studentAuthMessage.textContent = "❌ Password must be at least 4 characters.";
    return;
  }
  if (password !== confirmPassword) {
    studentAuthMessage.textContent = "❌ Passwords do not match.";
    return;
  }

  const displayName = `${firstName} ${lastName}`.trim();
  const userResult = await createUser(username, classSection, password, displayName);
  if (!userResult) {
    studentAuthMessage.textContent = "❌ That username already exists. Try logging in instead.";
    return;
  }

  studentAuthMessage.textContent = `✅ Welcome, ${displayName}!`;
  await beginStudentSession(username, classSection, password, true);
}

function advanceLevel() {
  if (playerState.levelIndex >= monsters.length - 1) {
    playerState.levelIndex = monsters.length - 1;
    playerState.xp += 1;
    analyticsSessionCompletedLevels += 1;
    isGameOver = true;
    updateHud(playerState, currentMonster);
    setMessage("You defeated the final boss!");
    enableInput(false);
    markAnalyticsSessionOutcome("won", { finalLevel: playerState.levelIndex + 1 });
    saveGame(playerState);
    return;
  }

  playerState.levelIndex += 1;
  playerState.xp += 1;
  analyticsSessionCompletedLevels += 1;
  startBattleForCurrentLevel();
  setMessage(`${currentMonster.name} approaches!`);
  saveGame(playerState);
}

function handleAnswer(event) {
  event.preventDefault();
  if (!currentQuestion || isGameOver || isPaused) return;

  const answer = document.getElementById("answer-input").value;
  const result = resolveTurn(answer, currentQuestion.answer, playerState, currentMonster);

  const isCorrect = result.result === "correct";
  trackQuestionAttempt(isCorrect, Number(answer), currentQuestion);

  if (isCorrect) {
    setPlayerState("attack");
    setMonsterState(currentMonster, "hurt");
    setMessage("Correct! The monster takes damage.");
    if (currentMonster.hp <= 0) {
      setMonsterState(currentMonster, "defeat");
      setMessage(`You defeated ${currentMonster.name}!`);
      enableInput(false);
      playerState.xp += 1;
      updateHud(playerState, currentMonster);
      saveGame(playerState);
      setTimeout(() => {
        advanceLevel();
      }, 700);
      return;
    }
  } else {
    setPlayerState("hurt");
    setMonsterState(currentMonster, "attack");
    setMessage("Wrong! You take damage.");
    if (playerState.hp <= 0) {
      setPlayerState("defeat");
      stopMonsterSpriteAnimation();
      setMessage("Game over. Start again.");
      isGameOver = true;
      enableInput(false);
      markAnalyticsSessionOutcome("lost", { finalLevel: playerState.levelIndex + 1 });
      saveGame(playerState);
      updateHud(playerState, currentMonster);
      return;
    }
  }

  adaptiveQuestionSystem.recordResult(isCorrect);
  const adaptiveQuestion = generateQuestion();
  currentQuestion = adaptiveQuestion;
  setQuestion(`What is ${adaptiveQuestion.a} × ${adaptiveQuestion.b}?`);
  updateHud(playerState, currentMonster);
  saveGame(playerState);
  setTimeout(() => {
    setPlayerState("idle");
    setMonsterState(currentMonster, "idle");
    clearAnswer();
  }, 500);
}

startGameButton.addEventListener("click", showStudentAuthPage);
studentLoginTab.addEventListener("click", () => setStudentMode("login"));
studentCreateTab.addEventListener("click", () => setStudentMode("create"));
studentLoginForm.addEventListener("submit", handleStudentLogin);
studentCreateForm.addEventListener("submit", handleStudentCreate);
studentBackButton.addEventListener("click", () => {
  resetStudentAuthForm();
  showLandingPage();
});
newGameButton.addEventListener("click", startFreshGame);
continueButton.addEventListener("click", continueCurrentGame);
leaderboardButton.addEventListener("click", async () => {
  showLeaderboardPage();
  await renderLeaderboard();
});
leaderboardBackButton.addEventListener("click", () => {
  if (postLoginMenuPage) {
    [landingPage, studentAuthPage, leaderboardPage, creditsPage, gamePage, teacherLoginPage, teacherDashboardPage].forEach((page) => {
      if (page) page.classList.add("hidden");
    });
    postLoginMenuPage.classList.remove("hidden");
  }
});
creditsBackButton.addEventListener("click", () => {
  if (postLoginMenuPage) {
    [landingPage, studentAuthPage, leaderboardPage, creditsPage, gamePage, teacherLoginPage, teacherDashboardPage].forEach((page) => {
      if (page) page.classList.add("hidden");
    });
    postLoginMenuPage.classList.remove("hidden");
  }
});
creditsButton.addEventListener("click", () => {
  showCreditsPage();
});
exitButton.addEventListener("click", () => {
  resetAdaptiveQuestionSystem();
  playerState.username = "";
  playerState.hp = 10;
  playerState.levelIndex = 0;
  playerState.xp = 0;
  resetStudentAuthForm();
  showLandingPage();
});
answerForm.addEventListener("submit", handleAnswer);

if (pauseButton) {
  pauseButton.addEventListener("click", () => {
    if (isPaused) {
      closePauseMenu();
    } else {
      openPauseMenu();
    }
  });
}

if (continueGameButton) {
  continueGameButton.addEventListener("click", () => {
    closePauseMenu();
  });
}

if (saveGameButton) {
  saveGameButton.addEventListener("click", async () => {
    await saveGame(playerState);
    setMessage("Game saved.");
    closePauseMenu();
  });
}

if (exitSaveButton) {
  exitSaveButton.addEventListener("click", saveAndReturnToMenu);
}

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    if (analyticsSessionId) {
      markAnalyticsSessionOutcome("paused", { source: "logout" });
    }
    resetAdaptiveQuestionSystem();
    playerState.username = "";
    playerState.hp = 10;
    playerState.levelIndex = 0;
    playerState.xp = 0;
    analyticsSessionId = null;
    resetStudentAuthForm();
    showLandingPage();
  });
}

window.addEventListener("load", () => {
  showLandingPage();
  setPauseMenu(false);
  setPlayerState("idle");
  const battleLevel = getBattleMonster(playerState.levelIndex);
  currentMonster = { ...battleLevel };
  setBackgroundForLevel(battleLevel);
  setMonsterState(currentMonster, "idle");
});

window.addEventListener("beforeunload", () => {
  if (analyticsSessionId) {
    markAnalyticsSessionOutcome("paused", { source: "page_close" });
  }
});
