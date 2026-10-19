import { UI } from '../config/ui.js'

export function renderUpgradeChoices(panel, choices, wave) {
  const keyAt = (index) => UI.upgrades.keyboardKeys[index] ?? index + 1
  const keyHints = UI.upgrades.keyboardKeys.map((key) => `<kbd>${key}</kbd>`).join(' ')
  panel.innerHTML = `<header class="upgrade-heading"><span>OLEADA ${wave} COMPLETADA</span><h2>Elige una mejora</h2></header><div class="upgrade-cards">${choices.map((choice, index) => `<button class="upgrade-card rarity-${choice.rarity === 'épica' ? 'epic' : choice.rarity === 'rara' ? 'rare' : 'common'}" data-upgrade-index="${index}" aria-label="Opción ${keyAt(index)}: ${choice.name}, ${choice.rarity}"><span class="upgrade-key">${keyAt(index)}</span><span class="upgrade-icon-circle"><span class="upgrade-icon">${UI.upgrades.icons[choice.key] || '✦'}</span></span><strong class="upgrade-name">${choice.name}</strong><span class="upgrade-description">${choice.desc}</span><span class="upgrade-footer"><b class="upgrade-rarity">${choice.rarity.toUpperCase()}</b><small class="upgrade-synergy">${choice.synergy}</small></span></button>`).join('')}</div><p class="upgrade-hint">LEVANTA LA MANO IZQUIERDA / DERECHA / AMBAS <span>·</span> O PULSA ${keyHints}</p>`
}

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

export function fusionMethodForUpgrade(key) {
  if (!key?.startsWith('fusion')) return null
  const method = key.slice('fusion'.length).toLowerCase()
  return ['parity', 'crc', 'hamming'].includes(method) ? method : null
}

export function evolvedMethodLabel(method, level = 0) {
  const names = { parity: 'PARIDAD', crc: 'CRC', hamming: 'HAMMING' }
  return `${names[method] || String(method || '').toUpperCase()}${'+'.repeat(Math.max(0, Math.min(2, level)))}${level ? '' : ''}`
}
