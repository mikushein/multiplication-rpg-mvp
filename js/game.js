import { playerState } from "./player.js";
import { monsters } from "./monsters.js";
import { generateQuestion } from "./questions.js";
import { resolveTurn } from "./battle.js";
import { loadGame, saveGame, createUser, loginUser } from "./storage.js";
import {
  setPlayerState,
  setMonsterState,
  updateHud,
  setQuestion,
  setMessage,
  enableInput,
  clearAnswer
} from "./ui.js";

const loginPage = document.getElementById("login-page");
const gamePage = document.getElementById("game-page");
const startButton = document.getElementById("start-button");
const logoutButton = document.getElementById("logout-button");
const usernameInput = document.getElementById("username-input");
const classInput = document.getElementById("class-input");
const passwordInput = document.getElementById("password-input");
const loginMessage = document.getElementById("login-message");
const answerForm = document.getElementById("answer-form");

let currentMonster = null;
let currentQuestion = null;
let isGameOver = false;

function showLoginPage() {
  loginPage.classList.remove("hidden");
  gamePage.classList.add("hidden");
}

function showGamePage() {
  loginPage.classList.add("hidden");
  gamePage.classList.remove("hidden");
}

function resetLoginForm() {
  usernameInput.value = "";
  classInput.value = "";
  passwordInput.value = "";
  loginMessage.textContent = "";
}

function startBattleForCurrentLevel() {
  currentMonster = { ...monsters[playerState.levelIndex] };
  currentMonster.hp = 3;
  currentQuestion = generateQuestion();
  updateHud(playerState, currentMonster);
  setQuestion(`What is ${currentQuestion.a} × ${currentQuestion.b}?`);
  setMessage(`${currentMonster.name} appears!`);
  setMonsterState(currentMonster.name, "idle");
  enableInput(true);
  clearAnswer();
}

async function startGame() {
  const username = usernameInput.value.trim();
  const classSection = classInput.value.trim();
  const password = passwordInput.value.trim();

  // Validation
  if (!username) {
    loginMessage.textContent = "❌ Please enter your name";
    return;
  }
  if (!classSection) {
    loginMessage.textContent = "❌ Please enter your class section";
    return;
  }
  if (!password || password.length < 4) {
    loginMessage.textContent = "❌ Password must be at least 4 characters";
    return;
  }

  // Try to create user (will fail if user exists)
  let userResult = await createUser(username, classSection, password);
  let isNewPlayer = userResult !== null;
  
  // If user exists, try to login with password
  if (!userResult) {
    userResult = await loginUser(username, password);
    if (!userResult) {
      loginMessage.textContent = "❌ Username exists but password is incorrect. Try again.";
      return;
    }
  }

  playerState.username = username;

  // If returning player, load their progress from MongoDB
  if (!isNewPlayer) {
    const savedGame = await loadGame(username);
    if (savedGame) {
      playerState.levelIndex = savedGame.currentLevel;
      playerState.xp = savedGame.xp;
      playerState.hp = savedGame.playerHp || 3;
    }
  } else {
    // New player - start fresh
    playerState.hp = 3;
    playerState.levelIndex = 0;
    playerState.xp = 0;
  }

  isGameOver = false;

  showGamePage();
  setPlayerState("idle");
  startBattleForCurrentLevel();
  setMessage(`${username} (${classSection}), fight ${currentMonster.name}!`);
  await saveGame(playerState);
}

function advanceLevel() {
  if (playerState.levelIndex >= monsters.length - 1) {
    playerState.levelIndex = monsters.length - 1;
    playerState.xp += 1;
    isGameOver = true;
    updateHud(playerState, currentMonster);
    setMessage("You defeated the final boss!");
    enableInput(false);
    saveGame(playerState);
    return;
  }

  playerState.levelIndex += 1;
  playerState.xp += 1;
  startBattleForCurrentLevel();
  setMessage(`${currentMonster.name} approaches!`);
  saveGame(playerState);
}

function handleAnswer(event) {
  event.preventDefault();
  if (!currentQuestion || isGameOver) return;

  const answer = document.getElementById("answer-input").value;
  const result = resolveTurn(answer, currentQuestion.answer, playerState, currentMonster);

  if (result.result === "correct") {
    setPlayerState("attack");
    setMonsterState(currentMonster.name, "hurt");
    setMessage("Correct! The monster takes damage.");
    if (currentMonster.hp <= 0) {
      setMonsterState(currentMonster.name, "defeat");
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
    setMonsterState(currentMonster.name, "attack");
    setMessage("Wrong! You take damage.");
    if (playerState.hp <= 0) {
      setMessage("Game over. Start again.");
      isGameOver = true;
      enableInput(false);
      saveGame(playerState);
      updateHud(playerState, currentMonster);
      return;
    }
  }

  currentQuestion = generateQuestion();
  setQuestion(`What is ${currentQuestion.a} × ${currentQuestion.b}?`);
  updateHud(playerState, currentMonster);
  saveGame(playerState);
  setTimeout(() => {
    setPlayerState("idle");
    setMonsterState(currentMonster.name, "idle");
    clearAnswer();
  }, 500);
}

startButton.addEventListener("click", startGame);
answerForm.addEventListener("submit", handleAnswer);
logoutButton.addEventListener("click", () => {
  playerState.username = "";
  playerState.hp = 3;
  playerState.levelIndex = 0;
  playerState.xp = 0;
  resetLoginForm();
  showLoginPage();
});

window.addEventListener("load", () => {
  showLoginPage();
  setPlayerState("idle");
  currentMonster = { ...monsters[playerState.levelIndex] };
  setMonsterState(currentMonster.name, "idle");
});
