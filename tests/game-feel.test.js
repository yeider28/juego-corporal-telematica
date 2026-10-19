import test from 'node:test'
import assert from 'node:assert/strict'
import { BALANCE } from '../src/config/balance.js'
import { eligibleUpgrades } from '../src/escenas/mejoras.js'
import { evolvedMethodLabel } from '../src/escenas/mejoras.js'
import { fusedProjectileStats } from '../src/sistemas/fusion.js'

function simulateBlindFire(difficultyKey) {
  const difficulty = BALANCE.difficulty[difficultyKey]
  let lives = difficulty.lives
  let seed = difficulty.lives * 97
  let timeMs = 0
  let lastDamageAt = -Infinity
  let shieldActiveUntil = 0
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 0x100000000
  }

  for (let waveNumber = 1; waveNumber <= 4; waveNumber++) {
    const wave = BALANCE.waves[waveNumber]
    for (let index = 0; index < wave.count; index++) {
      const corrupted = random() < wave.corruptChance
      const x = 40 + random() * 880
      const fireLaneHit = Math.abs(x - 480) <= 57
      const damage = corrupted ? !fireLaneHit : fireLaneHit
      const eventAt = timeMs + index * wave.spawnInterval * 1000 + 9000
      if (corrupted && fireLaneHit && random() < BALANCE.powerUps.dropChance && random() < 0.5) {
        shieldActiveUntil = eventAt + BALANCE.powerUps.shieldDurationMs
      }
      if (eventAt < shieldActiveUntil) continue
      if (damage && eventAt - lastDamageAt >= BALANCE.player.invulnerabilityMs) {
        lives--
        lastDamageAt = eventAt
        if (lives <= 0) return false
      }
    }
    timeMs += wave.count * wave.spawnInterval * 1000
  }

  return true
}

test('las dos primeras oleadas presionan al jugador automático sin volver ganable el disparo fijo', () => {
  assert.ok(BALANCE.waves[1].count >= 18 && BALANCE.waves[1].spawnInterval >= 1.4)
  assert.ok(BALANCE.waves[2].count > BALANCE.waves[1].count)
  for (const difficulty of ['easy', 'normal', 'hard']) {
    assert.equal(simulateBlindFire(difficulty), false, `${difficulty} no debe ganar disparando en una sola línea`)
  }
})

test('la fusión se ofrece tras obtener multibola, solo para métodos equipados y hasta ++', () => {
  const fusions = BALANCE.upgrades.filter((upgrade) => upgrade.key.startsWith('fusion'))
  assert.equal(eligibleUpgrades(fusions, ['parity', 'hamming'], { multi: 0 }).length, 0)
  assert.deepEqual(eligibleUpgrades(fusions, ['parity', 'hamming'], { multi: 1 }).map((upgrade) => upgrade.key), ['fusionParity', 'fusionHamming'])
  assert.deepEqual(eligibleUpgrades(fusions, ['parity', 'hamming'], { multi: 1, fusionParity: 2 }).map((upgrade) => upgrade.key), ['fusionHamming'])
  assert.equal(evolvedMethodLabel('parity', 1), 'PARIDAD+')
  assert.equal(evolvedMethodLabel('parity', 2), 'PARIDAD++')
  assert.deepEqual(fusedProjectileStats('parity', 6, { fusionParity: 2 }), { level: 2, radius: 10, damage: 3 })
})
