import { GAMEPLAY } from '../config/gameplay.js'

export function bossPhaseForHealth(hp, maxHp) {
  const ratio = hp / maxHp
  return ratio <= GAMEPLAY.bossPhase.thirdThreshold ? 3 : ratio <= GAMEPLAY.bossPhase.secondThreshold ? 2 : 1
}
