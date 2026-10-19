import { collisionOverlapsAabb } from '../sistemas/colisiones.js'
import { congestionState } from '../sistemas/congestion.js'
import { isWaveComplete } from '../sistemas/oleadas.js'
import { COLORS } from '../config/colors.js'

export function canAdvanceGameplay(scene) {
  return scene.mode === 'playing'
}

export function updateGameplay(time, delta, { Phaser, W, H, BALANCE }) {
      this.updateParticles(delta)
      const slowFactor = this.slowMotionMs > 0 ? 0.35 : 1
      this.slowMotionMs = Math.max(0, this.slowMotionMs - delta)
      const dt = Math.min(delta / 1000, 0.04) * slowFactor
      this.stars?.forEach((s) => { s.y += dt * 12; if (s.y > H) { s.y = 0; s.x = Math.random() * W } })
      this.farGrid?.setPosition(Math.sin(time * 0.00012) * 4, Math.cos(time * 0.0001) * 3)
      this.circuitLayer?.setPosition(Math.sin(time * 0.0002) * 8, Math.sin(time * 0.00016) * 4)
      this.dataFlows?.forEach((flow) => {
        flow.object.x += flow.speed * dt
        if (flow.object.x > W + 8) flow.object.x = -8
        flow.object.y = this.flowLanes[flow.lane] + Math.sin(time * 0.004 + flow.offset) * 1.2 + this.circuitLayer.y
      })
      if (this.transitioning) return
      if (this.mode === 'title') { if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.ENTER)) this.startRun(); return }
      if (this.mode === 'tutorial') { if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.ENTER)) this.advanceTutorial(); return }
      if (this.mode === 'paused') return
      if (this.mode === 'upgrade' || this.mode === 'results') {
        if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.mode === 'upgrade' ? this.chooseUpgrade(0) : this.startRun()
        if (Phaser.Input.Keyboard.JustDown(this.keys.TWO) && this.mode === 'upgrade') this.chooseUpgrade(1)
        if (Phaser.Input.Keyboard.JustDown(this.keys.THREE) && this.mode === 'upgrade') this.chooseUpgrade(2)
        if (this.mode === 'results' && (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.ENTER))) this.startRun()
        return
      }
      if (!canAdvanceGameplay(this)) return
      if (this.hitStopMs > 0) {
        this.hitStopMs = Math.max(0, this.hitStopMs - delta)
        return
      }
      this.updatePowerUps(dt, delta)
      this.fireCooldown = Math.max(0, this.fireCooldown - dt)
      this.shotHeat = Math.max(0, this.shotHeat - BALANCE.combat.spamHeatDecayPerSecond * dt)
      this.invulnMs = Math.max(0, this.invulnMs - delta)
      this.cooldownBar?.setDisplaySize(138 * (1 - Math.min(1, this.fireCooldown / (this.fireCooldownMax || 0.34))), 5)
      this.updateHeatIndicator(time)
      let moveInput = Number(this.keys.RIGHT.isDown) - Number(this.keys.LEFT.isDown)
      const poseSteering = Boolean(window.poseControl?.active && this.poseTracking)
      let desiredVelocity = moveInput * BALANCE.player.moveSpeed
      if (poseSteering) {
        const followError = this.poseX - this.player.x
        desiredVelocity = Phaser.Math.Clamp(followError * BALANCE.player.poseFollowSpeed, -BALANCE.player.moveSpeed, BALANCE.player.moveSpeed)
        this.aim = Phaser.Math.Linear(this.aim, this.poseAim, Math.min(1, 7 * dt))
      } else {
        if (this.keys.A.isDown) this.aim = Math.max(-Math.PI + 0.2, this.aim - 1.65 * dt)
        if (this.keys.F.isDown) this.aim = Math.min(-0.2, this.aim + 1.65 * dt)
      }
      const gamepad = navigator.getGamepads?.().find((pad) => pad?.connected)
      if (gamepad) {
        const moveAxis = gamepad.axes?.[0] ?? 0
        if (Math.abs(moveAxis) > 0.18 && !poseSteering) moveInput = Phaser.Math.Clamp(moveInput + moveAxis, -1, 1)
        const aimX = gamepad.axes?.[2] ?? 0
        const aimY = gamepad.axes?.[3] ?? 0
        if (Math.hypot(aimX, aimY) > 0.28) this.aim = Phaser.Math.Clamp(Math.atan2(aimY, aimX), -Math.PI + 0.2, -0.2)
        if (gamepad.buttons?.[0]?.pressed || gamepad.buttons?.[7]?.pressed) this.fire()
      }
      if (!poseSteering) {
        const pointer = this.input.activePointer
        const mouseTargeting = pointer?.isDown && pointer.worldX >= 0 && pointer.worldX <= W
        desiredVelocity = mouseTargeting
          ? Phaser.Math.Clamp((pointer.worldX - this.player.x) * BALANCE.player.mouseFollowSpeed, -BALANCE.player.moveSpeed, BALANCE.player.moveSpeed)
          : moveInput * BALANCE.player.moveSpeed
      }
      const rate = desiredVelocity ? BALANCE.player.moveAcceleration : BALANCE.player.moveDeceleration
      const velocityDelta = Phaser.Math.Clamp(desiredVelocity - this.player.velocityX, -rate * dt, rate * dt)
      this.player.velocityX += velocityDelta
      this.player.x += this.player.velocityX * dt
      this.player.x = Phaser.Math.Clamp(this.player.x, 42, W - 42)
      if (this.player.x <= 42 || this.player.x >= W - 42) this.player.velocityX = 0
      const leanTarget = this.reducedMotion ? 0 : Phaser.Math.Clamp(this.player.velocityX / BALANCE.player.moveSpeed, -1, 1) * 0.055
      this.nodeLean = Phaser.Math.Linear(this.nodeLean || 0, leanTarget, 1 - Math.exp(-9 * dt))
      this.recoil = Math.max(0, (this.recoil || 0) - delta * 0.035)
      this.actor?.setPosition(this.player.x, this.player.y + (this.recoil || 0))
      this.actor?.setRotation(this.aim + Math.PI / 2 + this.nodeLean)
      if (!this.reducedMotion && this.actor && this.invulnMs > 0) this.actor.setAlpha(Math.floor(this.invulnMs / 90) % 2 ? 0.35 : 1)
      else this.actor?.setAlpha(1)
      this.drawAimPrediction()
      if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.selectBall(this.equippedBalls[0])
      if (Phaser.Input.Keyboard.JustDown(this.keys.TWO) && this.equippedBalls[1]) this.selectBall(this.equippedBalls[1])
      if (this.keys.SPACE.isDown) this.fire()
      if (this.spawned < this.waveTotal) {
        this.spawnTimer -= dt
        if (this.spawnTimer <= 0) { this.spawnBlock(); this.spawnTimer = BALANCE.waves[this.wave].spawnInterval }
      }
      this.updateBoss(delta, dt)
      if (this.mode !== 'playing') return
      const congestionChanged = congestionState(this.congested, this.blocks.length) !== this.congested
      if (congestionChanged) {
        this.congested = !this.congested
        this.updateMusicForWave()
        this.showToast(this.congested ? 'BUFFER LLENO · CONGESTIÓN' : 'BUFFER ESTABLE · FLUJO NORMAL')
        this.updateHud()
      }
      // Pools are capped; snapshot the lengths so collision side effects cannot
      // extend a traversal during this frame.
      const blockCount = Math.min(this.blocks.length, this.maxBlocks ?? 64)
      for (let blockIndex = blockCount - 1; blockIndex >= 0; blockIndex--) {
        const block = this.blocks[blockIndex]
        if (!block.alive) continue
        if (block.hitError || (block.boss && block.entering)) continue
        block.disruptedMs = Math.max(0, (block.disruptedMs || 0) - delta)
        const disrupted = block.disruptedMs > 0
        block.y += block.speed * (this.congested ? BALANCE.buffer.speedMultiplier : 1) * (this.powerUpTimers.slow > 0 ? BALANCE.powerUps.slowSpeedMultiplier : 1) * (disrupted ? 0.58 : 1) * dt
        if (block.zigzag) block.x = Phaser.Math.Clamp(block.originX + Math.sin(time * 0.0022 + block.zigzagPhase) * 68, 55, W - 55)
        const bob = this.reducedMotion ? 0 : Math.sin(time * 0.0032 + (block.seed ?? (block.seed = Math.random() * 6.28))) * 2.1
        const pulse = this.reducedMotion ? 1 : 1 + Math.sin(time * 0.0044 + block.seed) * 0.012
        const phasePulse = block.boss && block.phaseTransitionMs > 0 && !this.reducedMotion ? 1 + Math.sin(time * 0.026) * 0.045 : 1
        const crcGlitch = disrupted && !this.reducedMotion ? Math.sin(time * 0.036 + block.seed) * 2.6 : 0
        block.container.setPosition(block.x + crcGlitch, block.y + bob).setScale(pulse * phasePulse)
        block.impactFlashMs = Math.max(0, (block.impactFlashMs || 0) - delta)
        if (block.glowFx) {
          block.glowFx.color = block.impactFlashMs > 0 ? (block.impactColor ?? COLORS.cyan) : disrupted ? 0x68c9ff : (block.corrupted || block.boss ? COLORS.red : COLORS.cyan)
          block.glowFx.outerStrength = block.impactFlashMs > 0 ? 5.2 : block.boss ? 3.4 : block.corrupted ? 2.7 : 1.3
        }
        if (block.y >= H - 68 && !block.boss) {
          if (block.corrupted) {
            this.breakCombo()
            const lifeLost = this.loseLife()
            this.recordMetric('lost')
            this.emitBurst(block.x, H - 69, COLORS.red)
            if (lifeLost) this.triggerDamageFeedback()
          }
          this.removeBlock(block)
          if (this.lives <= 0) { this.finishRun(false); return }
        } else if (block.boss && block.y > 200) block.y = 200
      }
      const shotCount = Math.min(this.shots.length, this.maxShots ?? 36)
      for (let shotIndex = shotCount - 1; shotIndex >= 0; shotIndex--) {
        const shot = this.shots[shotIndex]
        if (!shot.alive) continue
        shot.x += shot.vx * dt; shot.y += shot.vy * dt
        shot.trailTimer = (shot.trailTimer || 0) + delta
        if (shot.trailTimer >= 32) { this.emitProjectileTrail(shot); shot.trailTimer = 0 }
        if (shot.type === 'crc' && (shot.x < 10 || shot.x > W - 10)) { shot.x = Phaser.Math.Clamp(shot.x, 10, W - 10); this.bounceShot(shot, 'x'); if (!shot.alive) continue }
        if (shot.type === 'crc' && shot.y < 12) { shot.y = 12; this.bounceShot(shot, 'y'); if (!shot.alive) continue }
        if (shot.bounces >= 3 || shot.y < 0 || shot.y > H) { this.destroyShot(shot); continue }
        shot.dot.setPosition(shot.x, shot.y); shot.aura.setPosition(shot.x, shot.y); shot.sprite?.setPosition(shot.x, shot.y)
        const collisionBlockCount = Math.min(this.blocks.length, this.maxBlocks ?? 64)
        for (let blockIndex = collisionBlockCount - 1; blockIndex >= 0; blockIndex--) {
          const block = this.blocks[blockIndex]
          if (block.alive && collisionOverlapsAabb(shot.x, shot.y, shot.radius, block)) { this.hitBlock(shot, block); if (this.mode !== 'playing') return; if (!shot.alive) break }
        }
      }
      if (isWaveComplete({ spawned: this.spawned, total: this.waveTotal, blocks: this.blocks })) this.completeWave()
}
