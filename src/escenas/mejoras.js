export function eligibleUpgrades(upgrades, equippedBalls, levels = {}) {
  return upgrades.filter((upgrade) => {
    if (upgrade.key === 'pierce' && !equippedBalls.includes('crc')) return false
    if (upgrade.key === 'hammingArea' && !equippedBalls.includes('hamming')) return false
    if (upgrade.key.startsWith('fusion')) {
      const type = upgrade.key.slice('fusion'.length).toLowerCase()
      const ball = type === 'parity' ? 'parity' : type
      if (!equippedBalls.includes(ball) || !(levels.multi > 0) || levels[upgrade.key] >= 2) return false
    }
    return true
  })
}
