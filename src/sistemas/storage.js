const LIMITS = {
  score: 1_000_000_000,
  wave: 5,
  durationSeconds: 3600,
  counters: 1_000_000,
  maxScores: 20,
  maxInitials: 5,
}

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const boundedInt = (value, max = LIMITS.counters) => Number.isFinite(value) ? Math.min(max, Math.max(0, Math.floor(value))) : 0
const boundedRate = (value) => Number.isFinite(value) ? Math.min(100, Math.max(0, Number(value))) : 0
const initials = (value) => String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, LIMITS.maxInitials)
const dateOrEmpty = (value) => typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value.slice(0, 32) : ''

export const DEFAULT_ACCESSIBILITY = Object.freeze({ smoothing: 0.58, deadZone: 0.012, temporalMs: 140, reducedMotion: false, palette: 'default', textSize: 100, volume: 70, muted: false })

export function validateAccessibility(value) {
  if (!isRecord(value)) return { ...DEFAULT_ACCESSIBILITY }
  return {
    smoothing: clampNumber(value.smoothing, 0.34, 0.82, DEFAULT_ACCESSIBILITY.smoothing),
    deadZone: clampNumber(value.deadZone, 0.005, 0.04, DEFAULT_ACCESSIBILITY.deadZone),
    temporalMs: Math.round(clampNumber(value.temporalMs, 80, 500, DEFAULT_ACCESSIBILITY.temporalMs) / 20) * 20,
    reducedMotion: typeof value.reducedMotion === 'boolean' ? value.reducedMotion : false,
    palette: ['default', 'contrast', 'blue-yellow'].includes(value.palette) ? value.palette : 'default',
    textSize: clampNumber(value.textSize, 90, 125, DEFAULT_ACCESSIBILITY.textSize),
    volume: clampNumber(value.volume, 0, 100, DEFAULT_ACCESSIBILITY.volume),
    muted: typeof value.muted === 'boolean' ? value.muted : false,
  }
}

function clampNumber(value, min, max, fallback) {
  return Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Number(value))) : fallback
}

export function validateGestureTrials(value) {
  const result = {}
  for (const key of ['move', 'aim', 'throw']) {
    const trial = isRecord(value) && isRecord(value[key]) ? value[key] : {}
    result[key] = {
      label: { move: 'MOVERSE', aim: 'APUNTAR', throw: 'LANZAR' }[key],
      success: Math.min(20, boundedInt(trial.success)),
      failure: Math.min(20 - Math.min(20, boundedInt(trial.success)), boundedInt(trial.failure)),
      falsePositive: boundedInt(trial.falsePositive),
    }
  }
  return result
}

export function validateRunSummary(value) {
  if (!isRecord(value)) return null
  const summary = {
    initials: initials(value.initials),
    score: boundedInt(value.score, LIMITS.score),
    wave: Math.min(LIMITS.wave, Math.max(1, boundedInt(value.wave, LIMITS.wave))),
    durationSeconds: boundedInt(value.durationSeconds, LIMITS.durationSeconds),
    won: value.won === true,
    equippedBalls: Array.isArray(value.equippedBalls) ? [...new Set(value.equippedBalls.filter((ball) => ['parity', 'crc', 'hamming'].includes(ball)))] .slice(0, 2) : [],
    detected: boundedInt(value.detected), corrected: boundedInt(value.corrected), lost: boundedInt(value.lost),
    detectedRate: boundedRate(value.detectedRate),
    correctionRate: value.correctionRate === null ? null : boundedRate(value.correctionRate),
    bitErrors: boundedInt(value.bitErrors), residualBitErrors: boundedInt(value.residualBitErrors),
    framesGenerated: boundedInt(value.framesGenerated), bitsPerFrame: Math.min(64, Math.max(1, boundedInt(value.bitsPerFrame, 64) || 8)),
    totalBits: boundedInt(value.totalBits),
    ber: boundedRate(value.ber), residualBer: boundedRate(value.residualBer),
    date: dateOrEmpty(value.date),
  }
  summary.metrics = {}
  if (isRecord(value.metrics)) {
    for (const key of ['created', 'corruptCreated', 'processed', 'detected', 'corrected', 'lost', 'healthyHit']) summary.metrics[key] = boundedInt(value.metrics[key])
  }
  summary.waveMetrics = Array.isArray(value.waveMetrics) ? value.waveMetrics.slice(0, LIMITS.wave).map((entry, index) => {
    const row = isRecord(entry) ? entry : {}
    return { wave: Math.min(LIMITS.wave, Math.max(1, boundedInt(row.wave, LIMITS.wave) || index + 1)), ...Object.fromEntries(['created', 'corruptCreated', 'processed', 'detected', 'corrected', 'lost', 'healthyHit'].map((key) => [key, boundedInt(row[key])])) }
  }) : []
  return summary
}

export function validateScores(value) {
  if (!Array.isArray(value)) return []
  return value.slice(0, LIMITS.maxScores).map(validateRunSummary).filter((entry) => entry && entry.initials)
}

export function readValidatedStorage(storage, key, validator, fallback) {
  try {
    const raw = storage?.getItem(key)
    if (raw === null || raw === undefined) return fallback
    const parsed = JSON.parse(raw)
    return validator(parsed)
  } catch {
    return fallback
  }
}
