/** Shared constants used by game rules and scene transitions. */
export const GAMEPLAY = Object.freeze({
  waves: { first: 1, last: 5, zigzag: 4 },
  waveStart: { firstSpawnDelaySeconds: 0.5 },
  lives: { causes: ['healthy', 'boss', 'corrupt'] },
  score: { scoreFloor: 0, scoreMagnetStep: 0.12 },
  boss: { entryTargetY: 145, entryStartY: -80, entryScale: 0.72, entryDurationMs: 1050 },
  bossPhase: { secondThreshold: 2 / 3, thirdThreshold: 1 / 3 },
  spawning: { xPadding: 90, startY: -35, waveFourZigzagChance: 0.65 },
})
