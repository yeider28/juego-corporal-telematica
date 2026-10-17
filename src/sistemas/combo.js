import { BALANCE } from '../config/balance.js'

export function comboScoreMultiplier(combo) {
  return Math.min(BALANCE.score.maxComboMultiplier, 1 + Math.floor(combo / BALANCE.score.precisionComboThreshold) * BALANCE.score.comboMultiplierStep)
}
