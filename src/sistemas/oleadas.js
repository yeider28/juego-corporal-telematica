import { GAMEPLAY } from '../config/gameplay.js'

export function beginWave(scene, balance) {
  const waveConfig = balance?.waves?.[scene?.wave]
  if (!scene || !waveConfig || !Number.isFinite(waveConfig.count) || waveConfig.count < 0) {
    throw new RangeError(`Configuración inválida para iniciar la oleada ${scene?.wave ?? 'desconocida'}.`)
  }
  if (typeof scene.ledger?.beginWave !== 'function' || typeof scene.updateMusicForWave !== 'function' || typeof scene.updateHud !== 'function' || typeof scene.showToast !== 'function') {
    throw new TypeError('La escena no está lista para iniciar una oleada.')
  }
  scene.ledger.beginWave(scene.wave)
  scene.updateMusicForWave()
  scene.waveTotal = waveConfig.count
  scene.spawned = 0
  scene.spawnTimer = GAMEPLAY.waveStart.firstSpawnDelaySeconds
  scene.boss = null
  if (scene.wave === GAMEPLAY.waves.last) scene.spawnBoss()
  scene.updateHud()
  scene.showToast(scene.wave === GAMEPLAY.waves.last ? 'ALERTA: TRAMA MASIVA' : `OLEADA ${String(scene.wave).padStart(2, '0')} // INICIADA`)
}

export function isWaveComplete({ spawned, total, blocks }) {
  // Preserve the scene's original rule: removeBlock must empty the active array.
  return spawned >= total && blocks.length === 0
}

export function isFinalWave(wave) {
  return wave >= GAMEPLAY.waves.last
}
