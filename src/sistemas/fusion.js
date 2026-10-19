export function fusionLevel(method, upgrades = {}) {
  const name = String(method || '')
  const key = `fusion${name[0]?.toUpperCase() || ''}${name.slice(1)}`
  return Math.max(0, Math.min(2, Math.floor(Number(upgrades[key]) || 0)))
}

export function fusedProjectileStats(method, baseRadius, upgrades = {}) {
  const level = fusionLevel(method, upgrades)
  return { level, radius: baseRadius + level * 2, damage: 1 + level }
}
