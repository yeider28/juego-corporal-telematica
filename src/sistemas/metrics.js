const EVENTS = ['created', 'corruptCreated', 'processed', 'detected', 'corrected', 'lost', 'misfires']

export function createRunLedger() {
  const totals = Object.fromEntries(EVENTS.map((event) => [event, 0]))
  const waves = []
  const ensureWave = (waveNumber) => {
    let entry = waves.find((item) => item.wave === waveNumber)
    if (!entry) { entry = { wave: waveNumber, ...Object.fromEntries(EVENTS.map((event) => [event, 0])) }; waves.push(entry) }
    return entry
  }
  return {
    totals,
    waves,
    beginWave: ensureWave,
    record(event, waveNumber, amount = 1) {
      if (!(event in totals) || amount <= 0) return
      const waveEntry = ensureWave(waveNumber)
      if (event === 'detected') amount = Math.min(amount, Math.max(0, totals.corruptCreated - totals.detected), Math.max(0, waveEntry.corruptCreated - waveEntry.detected))
      if (amount <= 0) return
      totals[event] += amount
      waveEntry[event] += amount
    },
    settle(block, waveNumber) {
      if (block.metricProcessed) return false
      block.metricProcessed = true
      this.record('processed', waveNumber)
      return true
    },
  }
}

export function calculateRunRates({ corrected, bitErrors, totalBits }) {
  return {
    correctionRate: bitErrors ? Number((corrected / bitErrors * 100).toFixed(2)) : 0,
    ber: totalBits ? Number((bitErrors / totalBits * 100).toFixed(2)) : 0,
  }
}

export function calculateBer({ bitErrors, residualBitErrors = 0, framesGenerated, bitsPerFrame = 8 }) {
  const frames = Math.max(0, Math.floor(Number(framesGenerated) || 0))
  const bitsPerFrameSafe = Math.max(1, Math.floor(Number(bitsPerFrame) || 8))
  const totalBits = frames * bitsPerFrameSafe
  const errors = Math.max(0, Math.min(totalBits, Math.floor(Number(bitErrors) || 0)))
  const residualErrors = Math.max(0, Math.min(errors, Math.floor(Number(residualBitErrors) || 0)))
  return {
    framesGenerated: frames,
    bitsPerFrame: bitsPerFrameSafe,
    bitErrors: errors,
    residualBitErrors: residualErrors,
    totalBits,
    ber: totalBits ? Number((errors / totalBits * 100).toFixed(2)) : 0,
    residualBer: totalBits ? Number((residualErrors / totalBits * 100).toFixed(2)) : 0,
  }
}

// El modelo genera exactamente un bit erróneo por cada trama corrupta.
export function calculateLedgerBer(totals, bitsPerFrame = 8) {
  return calculateBer({
    bitErrors: totals?.corruptCreated,
    residualBitErrors: totals?.lost,
    framesGenerated: totals?.created,
    bitsPerFrame,
  })
}
