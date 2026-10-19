import test from 'node:test'
import assert from 'node:assert/strict'
import { corruptFrameScore, isWaveComplete, penalizeScore, resolveLifeLoss } from '../src/sistemas/rules.js'

// Baseline before scene extraction: these outcomes must stay unchanged as rules move out of main.js.
test('regresión: vidas protegen con invulnerabilidad/escudo y aplican daño cuando corresponde', () => {
  assert.deepEqual(resolveLifeLoss({ lives: 3, invulnMs: 500, shield: 1, cause: 'boss' }), {
    lost: false, lives: 3, invulnMs: 500, shield: 1, cause: 'boss',
  })
  assert.deepEqual(resolveLifeLoss({ lives: 3, invulnMs: 0, shield: 1, cause: 'healthy' }), {
    lost: false, lives: 3, invulnMs: 0, shield: 0, cause: 'healthy',
  })
  assert.deepEqual(resolveLifeLoss({ lives: 1, invulnMs: 0, shield: 0, cause: 'corrupt' }), {
    lost: true, lives: 0, invulnMs: 900, shield: 0, cause: 'corrupt',
  })
})

test('regresión: puntuación conserva premios por método, combo, imán y penalización mínima', () => {
  assert.equal(corruptFrameScore({ type: 'parity', comboMultiplier: 1 }), 60)
  assert.equal(corruptFrameScore({ type: 'crc', comboMultiplier: 1.5, scoreMagnetUpgrades: 2 }), 167)
  assert.equal(penalizeScore(20, 50), 0)
  assert.equal(penalizeScore(100, 25), 75)
})

test('regresión: una oleada finaliza solo cuando generó todo y el arreglo de bloques está vacío', () => {
  assert.equal(isWaveComplete({ spawned: 18, total: 18, blocks: [] }), true)
  assert.equal(isWaveComplete({ spawned: 17, total: 18, blocks: [] }), false)
  assert.equal(isWaveComplete({ spawned: 18, total: 18, blocks: [{ alive: true }] }), false)
  assert.equal(isWaveComplete({ spawned: 18, total: 18, blocks: [{ alive: false }] }), false)
})
