import test from 'node:test'
import assert from 'node:assert/strict'
import { createRunLedger, calculateRunRates, calculateBer, calculateLedgerBer } from '../src/sistemas/metrics.js'

test('las métricas reflejan eventos de juego y cada trama procesada se cuenta una sola vez', () => {
  const ledger = createRunLedger()
  ledger.beginWave(1)
  ledger.record('created', 1, 3)
  ledger.record('corruptCreated', 1, 2)

  const corruptedDestroyed = {}
  ledger.record('detected', 1)
  ledger.record('detected', 1, 9) // Nunca puede detectar más corruptas de las generadas.
  ledger.settle(corruptedDestroyed, 1)
  ledger.settle(corruptedDestroyed, 1) // Un segundo retiro no duplica el evento.

  const correctedThenExited = {}
  ledger.record('corrected', 1)
  ledger.settle(correctedThenExited, 1)

  const missedCorruptFrame = {}
  ledger.record('lost', 1)
  ledger.settle(missedCorruptFrame, 1)

  ledger.record('misfires', 1)

  assert.deepEqual(ledger.totals, { created: 3, corruptCreated: 2, processed: 3, detected: 2, corrected: 1, lost: 1, misfires: 1 })
  assert.deepEqual(ledger.waves[0], { wave: 1, created: 3, corruptCreated: 2, processed: 3, detected: 2, corrected: 1, lost: 1, misfires: 1 })
})

test('las tasas muestran la fórmula de corrección y BER con los contadores del ledger', () => {
  assert.deepEqual(calculateRunRates({ corrected: 1, bitErrors: 2, totalBits: 16 }), { correctionRate: 50, ber: 12.5 })
  assert.deepEqual(calculateRunRates({ corrected: 0, bitErrors: 0, totalBits: 0 }), { correctionRate: 0, ber: 0 })
})

test('BER usa exactamente ocho bits por cada trama generada', () => {
  assert.deepEqual(calculateBer({ bitErrors: 3, residualBitErrors: 1, framesGenerated: 6 }), { framesGenerated: 6, bitsPerFrame: 8, bitErrors: 3, residualBitErrors: 1, totalBits: 48, ber: 6.25, residualBer: 2.08 })
  assert.deepEqual(calculateBer({ bitErrors: 1, framesGenerated: 3 }), { framesGenerated: 3, bitsPerFrame: 8, bitErrors: 1, residualBitErrors: 0, totalBits: 24, ber: 4.17, residualBer: 0 })
})

test('BER toma numerador y denominador directamente del ledger', () => {
  const ledger = createRunLedger()
  ledger.record('created', 1, 6)
  ledger.record('corruptCreated', 1, 3)
  assert.deepEqual(calculateLedgerBer(ledger.totals), {
    framesGenerated: 6, bitsPerFrame: 8, bitErrors: 3, residualBitErrors: 0,
    totalBits: 48, ber: 6.25, residualBer: 0,
  })
})

test('BER limita errores al total de bits y conserva resultados válidos en entradas límite', () => {
  assert.deepEqual(calculateBer({ bitErrors: 99, residualBitErrors: 20, framesGenerated: 2, bitsPerFrame: 4 }), { framesGenerated: 2, bitsPerFrame: 4, bitErrors: 8, residualBitErrors: 8, totalBits: 8, ber: 100, residualBer: 100 })
  assert.deepEqual(calculateBer({ bitErrors: -2, residualBitErrors: 4, framesGenerated: 0 }), { framesGenerated: 0, bitsPerFrame: 8, bitErrors: 0, residualBitErrors: 0, totalBits: 0, ber: 0, residualBer: 0 })
})
