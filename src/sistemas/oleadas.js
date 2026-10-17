import { GAMEPLAY } from '../config/gameplay.js'

export function beginWave(scene, balance) {
  scene.ledger.beginWave(scene.wave)
  scene.updateMusicForWave()
  const waveConfig = balance.waves[scene.wave]
  scene.waveTotal = waveConfig.count
  scene.spawned = 0
  scene.spawnTimer = GAMEPLAY.waveStart.firstSpawnDelaySeconds
  scene.boss = null
  if (scene.wave === GAMEPLAY.waves.last) scene.spawnBoss()
  scene.updateHud()
  scene.showToast(scene.wave === GAMEPLAY.waves.last ? 'ALERTA: TRAMA MASIVA' : `OLEADA ${String(scene.wave).padStart(2, '0')} // INICIADA`)
}

export function isWaveComplete({ spawned, total, blocks }) {
  return spawned >= total && blocks.every((block) => !block.alive)
}

export function isFinalWave(wave) {
  return wave >= GAMEPLAY.waves.last
}
