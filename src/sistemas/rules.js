import { BALANCE } from '../config/balance.js'
import { GAMEPLAY } from '../config/gameplay.js'
export { isFinalWave, isWaveComplete } from './oleadas.js'

/** Mirrors the order of protection checks performed when the player is hit. */
export function resolveLifeLoss({ lives, invulnMs, shield, cause = 'corrupt' }) {
  if (invulnMs > 0) return { lost: false, lives, invulnMs, shield, cause }
  if (shield > 0) return { lost: false, lives, invulnMs, shield: shield - 1, cause }
  return { lost: true, lives: lives - 1, invulnMs: BALANCE.player.invulnerabilityMs, shield, cause }
}

export function penalizeScore(score, penalty) {
  return Math.max(GAMEPLAY.score.scoreFloor, score - penalty)
}

export function corruptFrameScore({ type, comboMultiplier, scoreMagnetUpgrades = 0 }) {
  const base = type === 'crc' ? BALANCE.score.corruptCrc : BALANCE.score.corruptParity
  return Math.round(base * comboMultiplier * (1 + scoreMagnetUpgrades * GAMEPLAY.score.scoreMagnetStep))
}

