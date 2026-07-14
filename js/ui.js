const playerImage = document.getElementById("player-image");
const monsterImage = document.getElementById("monster-image");
const levelText = document.getElementById("level-text");
const xpText = document.getElementById("xp-text");
const playerHpText = document.getElementById("player-hp-text");
const monsterHpText = document.getElementById("monster-hp-text");
const monsterNameText = document.getElementById("monster-name");
const questionText = document.getElementById("question-text");
const answerInput = document.getElementById("answer-input");
const submitButton = document.querySelector("#answer-form button");
const messageArea = document.getElementById("message-area");

export const playerAnimations = {
  idle: "assets/player/idle.gif",
  attack: "assets/player/attack.gif",
  hurt: "assets/player/hurt.gif"
};

export function setPlayerState(state) {
  if (playerImage) {
    playerImage.src = playerAnimations[state];
  }
}

export function setMonsterState(monster, state) {
  const path = monsterAnimations[monster]?.[state];
  if (monsterImage && path) {
    monsterImage.src = path;
  }
}

export const monsterAnimations = {
  Slime: {
    idle: "assets/monsters/Slime/idle.gif",
    attack: "assets/monsters/Slime/attack.gif",
    hurt: "assets/monsters/Slime/hurt.gif",
    defeat: "assets/monsters/Slime/defeat.gif"
  },
  Goblin: {
    idle: "assets/monsters/Goblin/idle.gif",
    attack: "assets/monsters/Goblin/attack.gif",
    hurt: "assets/monsters/Goblin/hurt.gif",
    defeat: "assets/monsters/Goblin/defeat.gif"
  },
  Wolf: {
    idle: "assets/monsters/Wolf/idle.gif",
    attack: "assets/monsters/Wolf/attack.gif",
    hurt: "assets/monsters/Wolf/hurt.gif",
    defeat: "assets/monsters/Wolf/defeat.gif"
  },
  Orc: {
    idle: "assets/monsters/Orc/idle.gif",
    attack: "assets/monsters/Orc/attack.gif",
    hurt: "assets/monsters/Orc/hurt.gif",
    defeat: "assets/monsters/Orc/defeat.gif"
  },
  Boss: {
    idle: "assets/monsters/Boss/idle.gif",
    attack: "assets/monsters/Boss/attack.gif",
    hurt: "assets/monsters/Boss/hurt.gif",
    defeat: "assets/monsters/Boss/defeat.gif"
  }
};

export function updateHud(state, monster) {
  if (levelText) levelText.textContent = monster ? monster.name : "-";
  if (xpText) xpText.textContent = state.xp;
  if (playerHpText) playerHpText.textContent = state.hp;
  if (monsterHpText) monsterHpText.textContent = monster ? monster.hp : 3;
  if (monsterNameText) monsterNameText.textContent = monster ? monster.name : "";
}

export function setQuestion(text) {
  if (questionText) questionText.textContent = text;
}

export function setMessage(text) {
  if (messageArea) messageArea.textContent = text;
}

export function enableInput(enabled) {
  if (answerInput) answerInput.disabled = !enabled;
  if (submitButton) submitButton.disabled = !enabled;
}

export function clearAnswer() {
  if (answerInput) answerInput.value = "";
}
