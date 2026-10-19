import test from 'node:test'
import assert from 'node:assert/strict'
import { collectDueMusicSteps } from '../src/sistemas/audio-scheduler.js'

test('el programador de música limita recuperación y corrige velocidad inválida', () => {
  const delayed = collectDueMusicSteps({ now: 10, nextAt: 0, rate: 1 })
  assert.ok(delayed.delays.length <= 4)
  assert.ok(delayed.nextAt > 10)

  const invalidRate = collectDueMusicSteps({ now: 2, nextAt: 2, rate: -1 })
  assert.equal(invalidRate.delays.length, 1)
  assert.ok(Number.isFinite(invalidRate.nextAt))
  assert.ok(invalidRate.nextAt > 2)
})

test('el programador de música termina ante un reloj o cursor no finitos', () => {
  const schedule = collectDueMusicSteps({ now: Number.NaN, nextAt: Number.NaN, rate: Number.POSITIVE_INFINITY })
  assert.ok(schedule.delays.length <= 4)
  assert.ok(Number.isFinite(schedule.nextAt))
})

test('el programador mantiene un máximo estricto ante incrementos que se redondean a cero', () => {
  const schedule = collectDueMusicSteps({ now: 1, nextAt: 1, rate: Number.MAX_VALUE, stepSeconds: Number.MIN_VALUE })
  assert.equal(schedule.delays.length, 4)
  assert.ok(Number.isFinite(schedule.nextAt))
})
