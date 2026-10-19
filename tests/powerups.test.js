import test from 'node:test'
import assert from 'node:assert/strict'
import { BALANCE } from '../src/config/balance.js'
import { powerUpDurationMs, rollPowerUpDrop } from '../src/sistemas/powerups.js'

test('los drops se limitan al escudo y la ralentización con sus duraciones de balance', () => {
  assert.deepEqual(BALANCE.powerUps.types, ['shield', 'slow'])
  assert.equal(rollPowerUpDrop(() => 0.1), 'shield')
  const randomSlow = [0, 0.75]
  assert.equal(rollPowerUpDrop(() => randomSlow.shift()), 'slow')
  assert.equal(rollPowerUpDrop(() => 0.99), null)
  assert.equal(powerUpDurationMs('shield'), BALANCE.powerUps.shieldDurationMs)
  assert.equal(powerUpDurationMs('slow'), BALANCE.powerUps.slowDurationMs)
  assert.equal(powerUpDurationMs('unknown'), 0)
})
