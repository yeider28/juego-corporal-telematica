import test from 'node:test'
import assert from 'node:assert/strict'
import { BALANCE } from '../src/config/balance.js'

const FRAME_SECONDS = 1 / 20
const AUTO_TARGET_SECONDS = 1.3
const NODE_Y = 540 - 68
const SPAWN_Y = -35

function simulateWave(waveNumber, difficulty) {
  const wave = BALANCE.waves[waveNumber]
  let seed = waveNumber
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 0x100000000
  }
  const frames = Array.from({ length: wave.count }, (_, index) => ({
    spawnAt: 0.5 + index * wave.spawnInterval,
    corrupted: waveNumber === 5 || random() < wave.corruptChance,
    y: SPAWN_Y,
    resolved: false,
  }))
  let time = 0

  if (waveNumber === 5) return 1.05 + wave.bossHealth * BALANCE.combat.shotCooldownSeconds + 0.8

  while (frames.some((frame) => !frame.resolved)) {
    const active = frames.filter((frame) => time >= frame.spawnAt && !frame.resolved)
    const congested = active.length >= BALANCE.buffer.congestionAt
    for (const frame of active) {
      if (frame.corrupted && time - frame.spawnAt >= AUTO_TARGET_SECONDS) {
        frame.resolved = true
      } else if (!frame.corrupted) {
        frame.y += wave.speed * difficulty.speedMultiplier * (congested ? BALANCE.buffer.speedMultiplier : 1) * FRAME_SECONDS
        if (frame.y >= NODE_Y) frame.resolved = true
      }
    }
    time += FRAME_SECONDS
  }

  return time
}

function simulateRun(difficultyKey) {
  const difficulty = BALANCE.difficulty[difficultyKey]
  let duration = 0
  for (let wave = 1; wave <= BALANCE.waves.length - 1; wave++) {
    duration += simulateWave(wave, difficulty)
    if (wave < BALANCE.waves.length - 1) duration += 1 // El jugador automático elige una mejora.
  }
  return duration
}

test('un jugador automático completa una partida de 3–5 minutos en cada dificultad', () => {
  for (const difficulty of ['easy', 'normal', 'hard']) {
    const firstWave = simulateWave(1, BALANCE.difficulty[difficulty])
    const secondWave = simulateWave(2, BALANCE.difficulty[difficulty])
    assert.ok(firstWave <= 45, `${difficulty}, oleada 1 demasiado lenta: ${firstWave.toFixed(1)} s`)
    assert.ok(secondWave <= 45, `${difficulty}, oleada 2 demasiado lenta: ${secondWave.toFixed(1)} s`)
    const duration = simulateRun(difficulty)
    assert.ok(duration >= 180 && duration <= 300, `${difficulty}: ${duration.toFixed(1)} s`)
  }
})
