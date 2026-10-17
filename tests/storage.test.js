import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_ACCESSIBILITY, validateAccessibility, validateGestureTrials, validateRunSummary, validateScores, readValidatedStorage } from '../src/sistemas/storage.js'

test('ajustes locales limitan valores y reemplazan propiedades inválidas', () => {
  assert.equal(validateAccessibility({ volume: 900, palette: 'x', muted: 'yes', temporalMs: NaN }).volume, 100)
  assert.deepEqual(validateAccessibility({ volume: 900, palette: 'x', muted: 'yes' }), { ...DEFAULT_ACCESSIBILITY, volume: 100 })
})

test('estadísticas de gestos descartan conteos corruptos y acotan intentos', () => {
  assert.deepEqual(validateGestureTrials({ move: { success: 900, failure: -1, falsePositive: 'oops' } }).move, { label: 'MOVERSE', success: 20, failure: 0, falsePositive: 0 })
})

test('puntajes y resumen exportado aceptan solo campos numéricos acotados e iniciales alfanuméricas', () => {
  const summary = validateRunSummary({ initials: 'A-!b123456', score: Infinity, wave: 99, durationSeconds: 9e8, equippedBalls: ['bogus', 'crc'], metrics: { lost: 7e9 }, waveMetrics: [null] })
  assert.equal(summary.initials, 'AB123')
  assert.equal(summary.score, 0)
  assert.equal(summary.wave, 5)
  assert.equal(summary.durationSeconds, 3600)
  assert.deepEqual(summary.equippedBalls, ['crc'])
  assert.equal(summary.metrics.lost, 1_000_000)
  assert.equal(validateScores([summary, {}, null]).length, 1)
})

test('lectura local no propaga JSON corrupto ni fallos de almacenamiento', () => {
  assert.deepEqual(readValidatedStorage({ getItem: () => '{' }, 'x', validateScores, []), [])
  assert.deepEqual(readValidatedStorage({ getItem: () => { throw Error() } }, 'x', validateScores, []), [])
})
