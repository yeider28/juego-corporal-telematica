import { GAMEPLAY } from '../config/gameplay.js'

export function bossEntryTargetY() {
  return GAMEPLAY.boss.entryTargetY
}

export function spawnBoss(scene, balance, width) {
  scene.playAudio('jefe')
  const boss = scene.createBlock(width / 2, GAMEPLAY.boss.entryStartY, true, true, balance.waves[GAMEPLAY.waves.last].bossHealth)
  boss.entering = true
  boss.container.setScale(GAMEPLAY.boss.entryScale)
  scene.tweens.add({ targets: boss.container, y: bossEntryTargetY(), scale: 1, duration: GAMEPLAY.boss.entryDurationMs, ease: 'Back.Out', onComplete: () => { if (boss.alive) { boss.y = bossEntryTargetY(); boss.entering = false } } })
  scene.bossHud?.setVisible(true)
  scene.showToast('ENTRADA DE TRAMA MASIVA')
  scene.spawned = 1
}

export function spawnBlock(scene, balance, width) {
  if (scene.spawned >= scene.waveTotal) return
  const waveConfig = balance.waves[scene.wave]
  const corrupted = Math.random() < waveConfig.corruptChance
  const block = scene.createBlock(GAMEPLAY.spawning.xPadding + Math.random() * (width - 2 * GAMEPLAY.spawning.xPadding), GAMEPLAY.spawning.startY, corrupted)
  block.zigzag = scene.wave === GAMEPLAY.waves.zigzag && Math.random() < GAMEPLAY.spawning.waveFourZigzagChance
  block.originX = block.x
  block.zigzagPhase = Math.random() * Math.PI * 2
  scene.spawned++
}
