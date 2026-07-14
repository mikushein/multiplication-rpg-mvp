export function resolveTurn(playerAnswer, questionAnswer, playerState, currentMonster) {
  if (Number(playerAnswer) === questionAnswer) {
    currentMonster.hp -= 1;
    return { result: "correct", monsterHp: currentMonster.hp };
  }

  playerState.hp -= 1;
  return { result: "wrong", playerHp: playerState.hp };
}
