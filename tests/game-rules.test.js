import test from 'node:test'
import assert from 'node:assert/strict'
import { corruptFrameScore, isFinalWave, isWaveComplete, penalizeScore, resolveLifeLoss } from '../src/sistemas/rules.js'
import { congestionState } from '../src/sistemas/congestion.js'
import { collisionOverlapsAabb } from '../src/sistemas/colisiones.js'
import { bossPhaseForHealth } from '../src/sistemas/jefe.js'

test('las vidas respetan invulnerabilidad, escudo y pérdida con causa conservada', () => {
  assert.deepEqual(resolveLifeLoss({ lives: 5, invulnMs: 1, shield: 1, cause: 'healthy' }), { lost: false, lives: 5, invulnMs: 1, shield: 1, cause: 'healthy' })
  assert.deepEqual(resolveLifeLoss({ lives: 5, invulnMs: 0, shield: 1 }), { lost: false, lives: 5, invulnMs: 0, shield: 0, cause: 'corrupt' })
  assert.deepEqual(resolveLifeLoss({ lives: 1, invulnMs: 0, shield: 0, cause: 'boss' }), { lost: true, lives: 0, invulnMs: 900, shield: 0, cause: 'boss' })
})

test('la puntuación conserva premios por método y multiplicador y no baja de cero', () => {
  assert.equal(corruptFrameScore({ type: 'parity', comboMultiplier: 1 }), 60)
  assert.equal(corruptFrameScore({ type: 'crc', comboMultiplier: 1.5, scoreMagnetUpgrades: 2 }), 167)
  assert.equal(penalizeScore(20, 50), 0)
  assert.equal(penalizeScore(100, 25), 75)
})

test('la oleada termina al generar el total y retirar todos los bloques vivos', () => {
  assert.equal(isWaveComplete({ spawned: 3, total: 3, blocks: [{ alive: false }] }), true)
  assert.equal(isWaveComplete({ spawned: 2, total: 3, blocks: [{ alive: false }] }), false)
  assert.equal(isWaveComplete({ spawned: 3, total: 3, blocks: [{ alive: true }] }), false)
  assert.equal(isFinalWave(4), false)
  assert.equal(isFinalWave(5), true)
})

test('congestión usa umbrales distintos de entrada y recuperación', () => {
  assert.equal(congestionState(false, 4), false)
  assert.equal(congestionState(false, 5), true)
  assert.equal(congestionState(true, 3), true)
  assert.equal(congestionState(true, 2), false)
})

test('colisiones conservan el límite estricto y el jefe cambia de fase por salud', () => {
  const block = { x: 10, y: 10, w: 20, h: 20 }
  assert.equal(collisionOverlapsAabb(19, 10, 1, block), true)
  assert.equal(collisionOverlapsAabb(21, 10, 1, block), false)
  assert.equal(bossPhaseForHealth(9, 12), 1)
  assert.equal(bossPhaseForHealth(8, 12), 2)
  assert.equal(bossPhaseForHealth(4, 12), 3)
})
