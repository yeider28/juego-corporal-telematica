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

test('estadísticas corruptas de gestos se descartan y la exportación se limita', () => {
  const fallback = validateGestureTrials(null)
  assert.deepEqual(readValidatedStorage({ getItem: () => '{invalid' }, 'gestures', validateGestureTrials, fallback), fallback)
  const sanitized = validateGestureTrials({ move: { success: 4.8, failure: 30, falsePositive: -3 }, aim: { success: 'NaN' } })
  assert.deepEqual(sanitized.move, { label: 'MOVERSE', success: 4, failure: 16, falsePositive: 0 })
  assert.equal(sanitized.aim.success, 0)
})

test('iniciales exportables contienen solo cinco caracteres alfanuméricos', () => {
  assert.equal(validateRunSummary({ initials: 'ab-!123456' }).initials, 'AB123')
})

test('preferencias de accesibilidad persisten y se revalidan al recargar', () => {
  const data = new Map()
  const storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }
  const preferences = { ...DEFAULT_ACCESSIBILITY, volume: 35, muted: true, palette: 'blue-yellow', reducedMotion: true, crt: true, smoothing: 0.82, deadZone: 0.025, temporalMs: 280, textSize: 115 }
  storage.setItem('accessibility', JSON.stringify(preferences))
  assert.deepEqual(readValidatedStorage(storage, 'accessibility', validateAccessibility, { ...DEFAULT_ACCESSIBILITY }), preferences)
  storage.setItem('accessibility', JSON.stringify({ ...preferences, volume: 140, deadZone: -1, temporalMs: 999, palette: 'invalid' }))
  const restored = readValidatedStorage(storage, 'accessibility', validateAccessibility, { ...DEFAULT_ACCESSIBILITY })
  assert.equal(restored.volume, 100)
  assert.equal(restored.deadZone, 0.005)
  assert.equal(restored.temporalMs, 500)
  assert.equal(restored.palette, 'default')
  assert.equal(restored.muted, true)
  assert.equal(restored.reducedMotion, true)
  assert.equal(restored.crt, true)
})
