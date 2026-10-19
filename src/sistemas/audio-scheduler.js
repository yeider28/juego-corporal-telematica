const DEFAULT_STEP_SECONDS = 0.22
const DEFAULT_LOOK_AHEAD_SECONDS = 0.08
const MAX_CATCH_UP_STEPS = 4

/**
 * Returns a bounded list of music beats due for scheduling.
 * A corrupt clock/rate or a long suspended tab must never monopolize the UI thread.
 */
export function collectDueMusicSteps({ now, nextAt, rate, stepSeconds = DEFAULT_STEP_SECONDS, lookAheadSeconds = DEFAULT_LOOK_AHEAD_SECONDS }) {
  const safeNow = Number.isFinite(now) ? now : 0
  const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 1
  const safeStep = Number.isFinite(stepSeconds) && stepSeconds > 0 ? stepSeconds : DEFAULT_STEP_SECONDS
  const safeLookAhead = Number.isFinite(lookAheadSeconds) && lookAheadSeconds >= 0 ? lookAheadSeconds : DEFAULT_LOOK_AHEAD_SECONDS
  const stepDuration = safeStep / safeRate
  let cursor = Number.isFinite(nextAt) ? nextAt : safeNow + 0.02

  if (safeNow - cursor > 0.4) cursor = safeNow + 0.02

  const due = []
  // A for-loop gives a hard termination bound even if floating-point addition
  // cannot advance cursor (for example, an extreme but finite playback rate).
  for (let iter = 0; iter < MAX_CATCH_UP_STEPS && cursor < safeNow + safeLookAhead; iter++) {
    due.push(Math.max(0, cursor - safeNow))
    cursor += stepDuration
  }

  // Skip an excessive backlog instead of trying to catch up indefinitely.
  if (due.length === MAX_CATCH_UP_STEPS && cursor < safeNow + safeLookAhead) cursor = safeNow + stepDuration
  return { delays: due, nextAt: cursor }
}
