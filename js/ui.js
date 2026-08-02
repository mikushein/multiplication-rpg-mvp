import { monsters } from "./monsters.js";

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
let playerSpriteTimer = null;
let playerAnimationToken = 0;

export const playerAnimations = {
  idle: { src: "assets/player/idle.png", fps: 8, loop: true, frames: 12, frameWidth: 64, frameHeight: 70, scale: 3 },
  attack: { src: "assets/player/attack.png", fps: 20, loop: false, frames: 8, frameWidth: 64, frameHeight: 70, scale: 3 },
  hurt: { src: "assets/player/hurt.png", fps: 6, loop: false, frames: 5, frameWidth: 64, frameHeight: 70, scale: 3 },
  defeat: { src: "assets/player/defeat.png", fps: 6, loop: false, frames: 7, frameWidth: 64, frameHeight: 70, scale: 3 }
};

export function setPlayerState(state) {
  if (!playerImage) return;

  const animation = playerAnimations[state];
  if (!animation) return;

  if (typeof animation === "string") {
    playerImage.onload = null;
    playerImage.src = animation;
    resetImageStyle(playerImage);
    return;
  }

  stopPlayerSpriteAnimation();
  const thisToken = ++playerAnimationToken;

  const onLoaded = () => {
    if (thisToken !== playerAnimationToken) return;

    const frameHeight = animation.frameHeight || playerImage.naturalHeight;
    const frameWidth = animation.frameWidth || Math.max(1, Math.floor(playerImage.naturalWidth / (animation.frames || 1)));
    const frames = animation.frames || Math.max(1, Math.floor(playerImage.naturalWidth / frameWidth));
    const fps = animation.fps || 8;
    const loop = animation.loop ?? state !== "hurt";
    const frameDuration = Math.max(50, Math.floor(1000 / fps));
    const scale = animation.scale || 1;

    playerImage.style.width = `${frameWidth}px`;
    playerImage.style.height = `${frameHeight}px`;
    playerImage.style.objectFit = "none";
    playerImage.style.objectPosition = "0px 0px";
    playerImage.style.imageRendering = "pixelated";
    playerImage.style.display = "block";
    playerImage.style.margin = "0 auto";
    playerImage.style.transform = `scale(${scale})`;
    playerImage.style.transformOrigin = "center center";

    let frameIndex = 0;
    playerSpriteTimer = setInterval(() => {
      if (thisToken !== playerAnimationToken) return;
      frameIndex += 1;

      if (frameIndex >= frames) {
        if (loop) {
          frameIndex = 0;
        } else {
          frameIndex = frames - 1;
          stopPlayerSpriteAnimation();
        }
      }

      playerImage.style.objectPosition = `${-frameIndex * frameWidth}px 0px`;
    }, frameDuration);
  };

  playerImage.onload = onLoaded;
  playerImage.src = animation.src;
}

function stopPlayerSpriteAnimation() {
  if (playerSpriteTimer) {
    clearInterval(playerSpriteTimer);
    playerSpriteTimer = null;
  }
}

export function stopMonsterSpriteAnimation() {
  if (monsterSpriteTimer) {
    clearInterval(monsterSpriteTimer);
    monsterSpriteTimer = null;
  }
}

function resetImageStyle(imageElement) {
  if (!imageElement) return;
  imageElement.style.width = "";
  imageElement.style.height = "";
  imageElement.style.objectFit = "";
  imageElement.style.objectPosition = "";
  imageElement.style.imageRendering = "auto";
  imageElement.style.transform = "";
  imageElement.style.transformOrigin = "";
  imageElement.style.display = "";
  imageElement.style.margin = "";
}

function resetMonsterImageStyle() {
  resetImageStyle(monsterImage);
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
    const scale = config.scale || 1;

    monsterImage.style.width = `${frameWidth}px`;
    monsterImage.style.height = `${frameHeight}px`;
    monsterImage.style.objectFit = "none";
    monsterImage.style.objectPosition = "0px 0px";
    monsterImage.style.imageRendering = "pixelated";
    monsterImage.style.display = "block";
    monsterImage.style.margin = "0 auto";
    monsterImage.style.transform = `scale(${scale})`;
    monsterImage.style.transformOrigin = "center center";

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

function getAnimationConfig(monster, state) {
  if (!monster) return null;

  const assetFolder = monster.assetFolder || monster.spriteKey || monster.name;
  const directAnimation = monsterAnimations[assetFolder]?.[state];
  if (directAnimation) return directAnimation;

  if (typeof monster === "string") {
    return monsterAnimations[monster]?.[state] || null;
  }

  if (assetFolder) {
    return {
      src: `assets/monsters/${assetFolder}/${state}.png`,
      fps: 8,
      loop: state !== "defeat",
      frames: 6,
      frameWidth: 64,
      frameHeight: 70,
      scale: 3
    };
  }

  return null;
}

export function setMonsterState(monster, state) {
  const animation = getAnimationConfig(monster, state);
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
    idle: { src: "assets/monsters/Slime/idle.png", fps: 8, loop: true, frames: 6, frameWidth: 64, frameHeight: 70, scale: 3 },
    attack: { src: "assets/monsters/Slime/attack.png", fps: 10, loop: true, frames: 10, frameWidth: 64, frameHeight: 70, scale: 3 },
    hurt: { src: "assets/monsters/Slime/hurt.png", fps: 10, loop: false, frames: 5, frameWidth: 64, frameHeight: 70, scale: 3 },
    defeat: { src: "assets/monsters/Slime/defeat.png", fps: 8, loop: false, frames: 10, frameWidth: 64, frameHeight: 70, scale: 3 }
  },
  Goblin: {
    idle: { src: "assets/monsters/Goblin/idle.png", fps: 8, loop: true, frames: 4, frameWidth: 64, frameHeight: 70 },
    attack: { src: "assets/monsters/Goblin/attack.png", fps: 10, loop: true, frames: 8, frameWidth: 64, frameHeight: 70 },
    hurt: { src: "assets/monsters/Goblin/hurt.png", fps: 10, loop: false, frames: 6, frameWidth: 64, frameHeight: 70 },
    defeat: { src: "assets/monsters/Goblin/defeat.png", fps: 8, loop: false, frames: 8, frameWidth: 64, frameHeight: 70 }
  },
  Plant1: {
    idle: { src: "assets/monsters/Plant1/idle.png", fps: 6, loop: true, frames: 4, frameWidth: 64, frameHeight: 70, scale: 3 },
    attack: { src: "assets/monsters/Plant1/attack.png", fps: 8, loop: true, frames: 7, frameWidth: 64, frameHeight: 70, scale: 3 },
    hurt: { src: "assets/monsters/Plant1/hurt.png", fps: 10, loop: false, frames: 5, frameWidth: 64, frameHeight: 70, scale: 3 },
    defeat: { src: "assets/monsters/Plant1/defeat.png", fps: 8, loop: false, frames: 10, frameWidth: 64, frameHeight: 70, scale: 3 }
  },
  Plant2: {
    idle: { src: "assets/monsters/Plant2/idle.png", fps: 8, loop: true, frames: 6, frameWidth: 64, frameHeight: 70, scale: 3 },
    attack: { src: "assets/monsters/Plant2/attack.png", fps: 8, loop: true, frames: 6, frameWidth: 64, frameHeight: 70, scale: 3 },
    hurt: { src: "assets/monsters/Plant2/hurt.png", fps: 10, loop: false, frames: 6, frameWidth: 64, frameHeight: 70, scale: 3 },
    defeat: { src: "assets/monsters/Plant2/defeat.png", fps: 8, loop: false, frames: 6, frameWidth: 64, frameHeight: 70, scale: 3 }
  },
  Plant3: {
    idle: { src: "assets/monsters/Plant3/idle.png", fps: 8, loop: true, frames: 6, frameWidth: 64, frameHeight: 70, scale: 3 },
    attack: { src: "assets/monsters/Plant3/attack.png", fps: 8, loop: true, frames: 6, frameWidth: 64, frameHeight: 70, scale: 3 },
    hurt: { src: "assets/monsters/Plant3/hurt.png", fps: 10, loop: false, frames: 6, frameWidth: 64, frameHeight: 70, scale: 3 },
    defeat: { src: "assets/monsters/Plant3/defeat.png", fps: 8, loop: false, frames: 6, frameWidth: 64, frameHeight: 70, scale: 3 }
  },
  Vampire1: {
    idle: { src: "assets/monsters/Vampire1/idle.png", fps: 8, loop: true, frames: 6, frameWidth: 64, frameHeight: 70, scale: 3 },
    attack: { src: "assets/monsters/Vampire1/attack.png", fps: 8, loop: true, frames: 6, frameWidth: 64, frameHeight: 70, scale: 3 },
    hurt: { src: "assets/monsters/Vampire1/hurt.png", fps: 10, loop: false, frames: 6, frameWidth: 64, frameHeight: 70, scale: 3 },
    defeat: { src: "assets/monsters/Vampire1/defeat.png", fps: 8, loop: false, frames: 6, frameWidth: 64, frameHeight: 70, scale: 3 }
  },
  Vampire2: {
    idle: { src: "assets/monsters/Vampire2/idle.png", fps: 8, loop: true, frames: 6, frameWidth: 64, frameHeight: 70, scale: 3 },
    attack: { src: "assets/monsters/Vampire2/attack.png", fps: 8, loop: true, frames: 6, frameWidth: 64, frameHeight: 70, scale: 3 },
    hurt: { src: "assets/monsters/Vampire2/hurt.png", fps: 10, loop: false, frames: 6, frameWidth: 64, frameHeight: 70, scale: 3 },
    defeat: { src: "assets/monsters/Vampire2/defeat.png", fps: 8, loop: false, frames: 6, frameWidth: 64, frameHeight: 70, scale: 3 }
  },
  Vampire3: {
    idle: { src: "assets/monsters/Vampire3/idle.png", fps: 8, loop: true, frames: 6, frameWidth: 64, frameHeight: 70, scale: 3 },
    attack: { src: "assets/monsters/Vampire3/attack.png", fps: 8, loop: true, frames: 6, frameWidth: 64, frameHeight: 70, scale: 3 },
    hurt: { src: "assets/monsters/Vampire3/hurt.png", fps: 10, loop: false, frames: 6, frameWidth: 64, frameHeight: 70, scale: 3 },
    defeat: { src: "assets/monsters/Vampire3/defeat.png", fps: 8, loop: false, frames: 6, frameWidth: 64, frameHeight: 70, scale: 3 }
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

export function setBackgroundForLevel(levelData) {
  const shell = document.querySelector(".game-shell");
  if (!shell) return;

  Array.from(shell.classList)
    .filter((className) => className.startsWith("bg-"))
    .forEach((className) => shell.classList.remove(className));

  const phase = levelData?.phase || 1;
  const level = levelData?.level || 1;
  const backgroundName = `p${phase}-l${level}`;
  shell.classList.add(`bg-${backgroundName}`);
}

export function updateHud(state, monster) {
  if (levelText) {
    if (monster) {
      const phaseNumber = Math.floor(state.levelIndex / 3) + 1;
      const levelInPhase = (state.levelIndex % 3) + 1;
      levelText.textContent = `Phase ${phaseNumber} • Lv ${levelInPhase}`;
    } else {
      levelText.textContent = "-";
    }
  }
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