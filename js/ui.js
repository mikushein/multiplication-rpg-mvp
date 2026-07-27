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

let monsterSpriteTimer = null;
let monsterAnimationToken = 0;

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

function stopMonsterSpriteAnimation() {
  if (monsterSpriteTimer) {
    clearInterval(monsterSpriteTimer);
    monsterSpriteTimer = null;
  }
}

function resetMonsterImageStyle() {
  if (!monsterImage) return;
  monsterImage.style.width = "";
  monsterImage.style.height = "";
  monsterImage.style.objectFit = "";
  monsterImage.style.objectPosition = "";
  monsterImage.style.imageRendering = "auto";
}

function startSpriteSheetAnimation(config, state) {
  if (!monsterImage) return;

  stopMonsterSpriteAnimation();
  const thisToken = ++monsterAnimationToken;

  const onLoaded = () => {
    if (thisToken !== monsterAnimationToken) return;

    const frameHeight = config.frameHeight || monsterImage.naturalHeight;
    const frameWidth = config.frameWidth || Math.max(1, Math.floor(monsterImage.naturalWidth / (config.frames || 1)));
    const frames = config.frames || Math.max(1, Math.floor(monsterImage.naturalWidth / frameWidth));
    const fps = config.fps || 8;
    const loop = config.loop ?? (state !== "defeat");
    const frameDuration = Math.max(50, Math.floor(1000 / fps));

    monsterImage.style.width = `${frameWidth}px`;
    monsterImage.style.height = `${frameHeight}px`;
    monsterImage.style.objectFit = "none";
    monsterImage.style.objectPosition = "0px 0px";
    monsterImage.style.imageRendering = "pixelated";

    let frameIndex = 0;
    monsterSpriteTimer = setInterval(() => {
      if (thisToken !== monsterAnimationToken) return;
      frameIndex += 1;

      if (frameIndex >= frames) {
        if (loop) {
          frameIndex = 0;
        } else {
          frameIndex = frames - 1;
          stopMonsterSpriteAnimation();
        }
      }

      monsterImage.style.objectPosition = `${-frameIndex * frameWidth}px 0px`;
    }, frameDuration);
  };

  monsterImage.onload = onLoaded;
  monsterImage.src = config.src;
}

export function setMonsterState(monster, state) {
  const animation = monsterAnimations[monster]?.[state];
  if (!monsterImage || !animation) return;

  if (typeof animation === "string") {
    stopMonsterSpriteAnimation();
    resetMonsterImageStyle();
    monsterImage.onload = null;
    monsterImage.src = animation;
    return;
  }

  startSpriteSheetAnimation(animation, state);
}

export const monsterAnimations = {
  Slime: {
    idle: { src: "assets/monsters/Slime/idle.png", fps: 8, loop: true, frames: 6, frameWidth: 64, frameHeight: 70 },
    attack: { src: "assets/monsters/Slime/attack.png", fps: 10, loop: true, frames: 10, frameWidth: 64, frameHeight: 70 },
    hurt: { src: "assets/monsters/Slime/hurt.png", fps: 10, loop: false, frames: 5, frameWidth: 64, frameHeight: 70 },
    defeat: { src: "assets/monsters/Slime/defeat.png", fps: 8, loop: false, frames: 10, frameWidth: 64, frameHeight: 70 }
  },
  Goblin: {
    idle: { src: "assets/monsters/Goblin/idle.png", fps: 8, loop: true, frames: 4, frameWidth: 64, frameHeight: 70 },
    attack: { src: "assets/monsters/Goblin/attack.png", fps: 10, loop: true, frames: 8, frameWidth: 64, frameHeight: 70 },
    hurt: { src: "assets/monsters/Goblin/hurt.png", fps: 10, loop: false, frames: 6, frameWidth: 64, frameHeight: 70 },
    defeat: { src: "assets/monsters/Goblin/defeat.png", fps: 8, loop: false, frames: 8, frameWidth: 64, frameHeight: 70 }
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