export const monsters = [
  { phase: 1, level: 1, name: "Slime", hp: 5, assetFolder: "Slime1", background: "forest" },
  { phase: 1, level: 2, name: "Slime", hp: 5, assetFolder: "Slime2", background: "meadow" },
  { phase: 1, level: 3, name: "Plant", hp: 6, assetFolder: "Plant1", background: "ruins" },
  { phase: 2, level: 1, name: "Plant", hp: 6, assetFolder: "Plant2", background: "cave" },
  { phase: 2, level: 2, name: "Plant", hp: 6, assetFolder: "Plant1", background: "jungle" },
  { phase: 2, level: 3, name: "Slime", hp: 5, assetFolder: "Slime2", background: "moonlit" },
  { phase: 3, level: 1, name: "Orc", hp: 8, assetFolder: "Orc1", background: "swamp" },
  { phase: 3, level: 2, name: "Orc", hp: 8, assetFolder: "Orc2", background: "garden" },
  { phase: 3, level: 3, name: "Slime", hp: 5, assetFolder: "Slime3", background: "castle" },
  { phase: 4, level: 1, name: "Plant", hp: 6, assetFolder: "Plant3", background: "volcano" },
  { phase: 4, level: 2, name: "Orc", hp: 8, assetFolder: "Orc2", background: "desert" },
  { phase: 4, level: 3, name: "Orc", hp: 8, assetFolder: "Orc3", background: "storm" },
  { phase: 5, level: 1, name: "Slime", hp: 5, assetFolder: "Slime1", background: "river" },
  { phase: 5, level: 2, name: "Plant", hp: 6, assetFolder: "Plant1", background: "snow" },
  { phase: 5, level: 3, name: "Plant", hp: 6, assetFolder: "Plant3", background: "temple" },
  { phase: 6, level: 1, name: "Vampire", hp: 10, assetFolder: "Vampire1", background: "dungeon" },
  { phase: 6, level: 2, name: "Vampire", hp: 10, assetFolder: "Vampire2", background: "graveyard" },
  { phase: 6, level: 3, name: "Vampire", hp: 10, assetFolder: "Vampire3", background: "hellfire" }
];

export function getBattleMonster(levelIndex) {
  if (levelIndex < 0) return monsters[0];
  return monsters[Math.min(levelIndex, monsters.length - 1)];
}
