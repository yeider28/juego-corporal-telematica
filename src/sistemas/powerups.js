import { BALANCE } from '../config/balance.js'

export function rollPowerUpDrop(random = Math.random) {
  if (random() >= BALANCE.powerUps.dropChance) return null
  const index = Math.floor(random() * BALANCE.powerUps.types.length)
  return BALANCE.powerUps.types[index] ?? null
}

export function powerUpDurationMs(type) {
  if (type === 'shield') return BALANCE.powerUps.shieldDurationMs
  if (type === 'slow') return BALANCE.powerUps.slowDurationMs
  return 0
}
