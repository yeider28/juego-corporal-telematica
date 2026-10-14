import './style.css'
import { GestureTranslator, DEFAULT_GESTURE_THRESHOLDS } from './gestos/traductor.js'
import { solicitarCamara } from './vision/camara.js'

const app = document.querySelector('#app')
app.innerHTML = `
  <main class="shell">
    <header class="topbar"><a class="brand" href="#" aria-label="Tramas y Bloques, inicio"><span class="brand-mark">▦</span> TRAMAS <b>Y</b> BLOQUES</a><div class="top-status"><span class="status-dot"></span> SISTEMA EN LÍNEA</div></header>
    <section class="game-layout">
      <div class="game-column">
        <div class="game-frame"><div id="game"></div><div class="scanline" aria-hidden="true"></div>
          <section class="loadout-panel" id="loadout-panel" aria-label="Equipamiento antes de la partida">
            <div class="loadout-kicker">PREPARACIÓN DE ENLACE</div><h2>Elige tu loadout</h2>
            <p>Equipa hasta dos métodos de control y una ventaja inicial.</p>
            <div class="loadout-label">MÉTODOS · MÁXIMO 2</div>
            <div class="loadout-options">
              <button class="loadout-choice is-selected" data-loadout-ball="parity" aria-pressed="true"><i class="ball-icon parity"></i><b>Paridad</b><small>Impacto directo</small></button>
              <button class="loadout-choice" data-loadout-ball="crc" aria-pressed="false"><i class="ball-icon crc"></i><b>CRC</b><small>Rebota hasta 3 veces</small></button>
              <button class="loadout-choice is-selected" data-loadout-ball="hamming" aria-pressed="true"><i class="ball-icon hamming"></i><b>Hamming</b><small>Corrige y suma extra</small></button>
            </div>
            <div class="loadout-label">VENTAJA INICIAL</div>
            <div class="perk-options"><button class="perk-choice is-selected" data-loadout-perk="rapid">Disparo rápido</button><button class="perk-choice" data-loadout-perk="multi">Doble paquete</button><button class="perk-choice" data-loadout-perk="shield">Escudo de red</button></div>
            <button id="start-run" class="start-run">INICIAR PARTIDA <span>⏎</span></button>
          </section>
        </div>
        <div class="below-game"><span><kbd>←</kbd> <kbd>→</kbd> mover</span><span><kbd>A</kbd> <kbd>F</kbd> apuntar</span><span><kbd>ESPACIO</kbd> disparar</span><span><kbd>1</kbd><kbd>2</kbd> bolas equipadas</span><span><kbd>D</kbd> depuración</span></div>
      </div>
      <aside class="side-panel">
        <div class="panel-heading"><span class="eyebrow">PROTOCOLO ARCADE / 01</span><h1>Controla el flujo.</h1><p>Detecta las tramas corruptas. Deja pasar las sanas.</p></div>
        <div class="rule-card"><div class="card-icon">⌁</div><div><strong>Tu misión</strong><p>Destruye solo los paquetes con un bit rojo antes de que alcancen el nodo.</p></div></div>
        <div class="ball-list"><span class="eyebrow">MÉTODOS DE CONTROL</span><div class="ball-row"><i class="ball-icon parity"></i><div><b>Paridad</b><small>Impacto directo</small></div><kbd>1</kbd></div><div class="ball-row"><i class="ball-icon crc"></i><div><b>CRC</b><small>Rebota hasta 3 veces</small></div><kbd>2</kbd></div><div class="ball-row"><i class="ball-icon hamming"></i><div><b>Hamming</b><small>Corrige y suma extra</small></div><kbd>3</kbd></div></div>
        <button class="camera-button" id="camera-button"><span>◎</span> ACTIVAR CÁMARA <small>OPCIONAL</small></button>
        <div class="camera-state" id="camera-state">Teclado listo · Cámara desactivada</div>
        <div class="camera-view" id="camera-view"><video id="camera-preview" autoplay playsinline muted></video><canvas id="pose-skeleton" aria-label="Esqueleto detectado por la cámara"></canvas></div>
        <section id="gesture-debug" class="gesture-debug" hidden aria-live="polite">
          <div class="debug-heading"><b>PRUEBA DE GESTOS</b><span>TECLA D PARA CERRAR</span></div>
          <div class="debug-readings"><span id="debug-pose">POSE: SIN DATOS</span><span id="debug-values">Hombros — · Apunte — · Giro muñeca —</span></div>
          <p class="debug-instruction">Por gesto, registra 20 intentos: marca acierto o fallo. Registra falso positivo durante los periodos de reposo.</p>
          <div class="debug-trials" id="debug-trials"></div>
          <button id="debug-export" class="debug-export">DESCARGAR RESULTADOS JSON</button>
          <small class="debug-note">Los conteos se guardan en este navegador.</small>
        </section>
        <div class="aside-footer">5 OLEADAS <span>•</span> 1 NODO <span>•</span> 8 BITS</div>
      </aside>
    </section>
    <footer class="footer"><span>TELEMÁTICA // CAPA DE ENLACE</span><span>CHROME / EDGE 115+</span></footer>
  </main>`

const cameraButton = document.querySelector('#camera-button')
const cameraState = document.querySelector('#camera-state')
const video = document.querySelector('#camera-preview')
const cameraView = document.querySelector('#camera-view')
const skeletonCanvas = document.querySelector('#pose-skeleton')
const debugPanel = document.querySelector('#gesture-debug')
const debugPose = document.querySelector('#debug-pose')
const debugValues = document.querySelector('#debug-values')
const debugTrials = document.querySelector('#debug-trials')
const loadoutPanel = document.querySelector('#loadout-panel')
const loadoutSelection = { balls: ['parity', 'hamming'], perk: 'rapid' }

function renderLoadoutSelection() {
  document.querySelectorAll('[data-loadout-ball]').forEach((button) => {
    const selected = loadoutSelection.balls.includes(button.dataset.loadoutBall)
    button.classList.toggle('is-selected', selected)
    button.setAttribute('aria-pressed', String(selected))
    button.disabled = selected ? loadoutSelection.balls.length <= 1 : loadoutSelection.balls.length >= 2
  })
  document.querySelectorAll('[data-loadout-perk]').forEach((button) => {
    const selected = button.dataset.loadoutPerk === loadoutSelection.perk
    button.classList.toggle('is-selected', selected)
    button.setAttribute('aria-pressed', String(selected))
  })
}

document.querySelectorAll('[data-loadout-ball]').forEach((button) => button.addEventListener('click', () => {
  const ball = button.dataset.loadoutBall
  if (loadoutSelection.balls.includes(ball)) loadoutSelection.balls = loadoutSelection.balls.filter((value) => value !== ball)
  else if (loadoutSelection.balls.length < 2) loadoutSelection.balls.push(ball)
  renderLoadoutSelection()
}))
document.querySelectorAll('[data-loadout-perk]').forEach((button) => button.addEventListener('click', () => {
  loadoutSelection.perk = button.dataset.loadoutPerk
  renderLoadoutSelection()
}))
document.querySelector('#start-run').addEventListener('click', () => window.dispatchEvent(new Event('start-game-run')))
renderLoadoutSelection()
const testStorageKey = 'tramas-y-bloques-gesture-test'
const gestureTrials = {
  move: { label: 'MOVERSE', success: 0, failure: 0, falsePositive: 0 },
  aim: { label: 'APUNTAR', success: 0, failure: 0, falsePositive: 0 },
  throw: { label: 'LANZAR', success: 0, failure: 0, falsePositive: 0 },
}

try {
  const saved = JSON.parse(localStorage.getItem(testStorageKey) || '{}')
  for (const key of Object.keys(gestureTrials)) {
    for (const outcome of ['success', 'failure', 'falsePositive']) {
      gestureTrials[key][outcome] = Math.max(0, Number(saved[key]?.[outcome]) || 0)
    }
  }
} catch {}

function persistGestureTrials() {
  try { localStorage.setItem(testStorageKey, JSON.stringify(gestureTrials)) } catch {}
}

function renderGestureTrials() {
  debugTrials.innerHTML = Object.entries(gestureTrials).map(([key, trial]) => {
    const attempts = trial.success + trial.failure
    const failureRate = attempts ? `${Math.round(trial.failure / attempts * 100)}%` : '—'
    const complete = attempts >= 20
    return `<article class="trial-row"><div class="trial-title"><b>${trial.label}</b><span>${attempts}/20${complete ? ' · COMPLETO' : ''} · fallos ${failureRate} · FP ${trial.falsePositive}</span></div><div class="trial-actions"><button data-gesture="${key}" data-outcome="success" ${complete ? 'disabled' : ''}>✓ Acierto</button><button data-gesture="${key}" data-outcome="failure" ${complete ? 'disabled' : ''}>× Fallo</button><button data-gesture="${key}" data-outcome="falsePositive">! Falso +</button></div></article>`
  }).join('')
}

renderGestureTrials()
debugTrials.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-gesture][data-outcome]')
  if (!button) return
  const trial = gestureTrials[button.dataset.gesture]
  if (!trial || !(button.dataset.outcome in trial)) return
  trial[button.dataset.outcome]++
  persistGestureTrials()
  renderGestureTrials()
})

document.querySelector('#debug-export').addEventListener('click', () => {
  const report = { createdAt: new Date().toISOString(), thresholds: DEFAULT_GESTURE_THRESHOLDS, results: gestureTrials }
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url; link.download = 'tramas-prueba-gestos.json'; link.click(); URL.revokeObjectURL(url)
})

function paintPoseSkeleton(landmarks) {
  if (!video.videoWidth || !video.videoHeight) return
  if (skeletonCanvas.width !== video.videoWidth || skeletonCanvas.height !== video.videoHeight) {
    skeletonCanvas.width = video.videoWidth
    skeletonCanvas.height = video.videoHeight
  }
  const context = skeletonCanvas.getContext('2d')
  context.clearRect(0, 0, skeletonCanvas.width, skeletonCanvas.height)
  if (!landmarks) return
  const connections = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24]]
  context.lineWidth = Math.max(2, skeletonCanvas.width / 240)
  context.strokeStyle = '#18e6e1'
  for (const [start, end] of connections) {
    const a = landmarks[start]; const b = landmarks[end]
    if (!a || !b) continue
    context.beginPath(); context.moveTo(a.x * skeletonCanvas.width, a.y * skeletonCanvas.height); context.lineTo(b.x * skeletonCanvas.width, b.y * skeletonCanvas.height); context.stroke()
  }
  for (const index of [11, 12, 13, 14, 15, 16, 23, 24]) {
    const point = landmarks[index]
    if (!point) continue
    context.beginPath(); context.fillStyle = index === 15 ? '#ffcb57' : '#eaf8ff'; context.arc(point.x * skeletonCanvas.width, point.y * skeletonCanvas.height, Math.max(3, skeletonCanvas.width / 120), 0, Math.PI * 2); context.fill()
  }
}

function updateGestureDebug(sample) {
  if (!debugPanel || debugPanel.hidden) return
  debugPose.textContent = sample?.tracked ? 'POSE: HOMBROS DETECTADOS' : 'POSE: BUSCANDO HOMBROS'
  if (!sample?.tracked) {
    debugValues.textContent = 'Hombros — · Apunte — · Mano izq. — · Teclado disponible'
    return
  }
  const center = Math.round(sample.centerX * 100)
  const aim = Math.round(sample.aim * 180 / Math.PI)
  const wristTurn = Number.isFinite(sample.handAngle) ? `${Math.round(sample.handAngle * 180 / Math.PI)}°` : 'mano perdida'
  debugValues.textContent = `Centro ${center}% · X ${Math.round(sample.playerX)} · Apunte ${aim}° · Giro muñeca ${wristTurn} · ${sample.aimDetected ? 'muñeca visible' : 'muñeca perdida'}`
}

function toggleGestureDebug() {
  debugPanel.hidden = !debugPanel.hidden
  document.querySelector('.below-game').classList.toggle('debug-active', !debugPanel.hidden)
  updateGestureDebug(lastGestureSample)
}

let lastGestureSample = null

if (!window.Phaser) {
  document.querySelector('#game').innerHTML = '<div class="load-error">No se pudo cargar Phaser. Comprueba tu conexión y recarga la página.</div>'
} else {
  const W = 960
  const H = 540
      const COLORS = { cyan: 0x18e6e1, red: 0xff416d, blue: 0x6979ff, gold: 0xffcb57, green: 0x6bff9f, white: 0xeaf8ff, muted: 0x78909f, bg: 0x08121f, panel: 0x0d1b2b }
  const TYPE = { parity: { name: 'PARIDAD', color: COLORS.cyan }, crc: { name: 'CRC', color: COLORS.blue }, hamming: { name: 'HAMMING', color: COLORS.gold } }
  let currentScene
  window.addEventListener('start-game-run', () => currentScene?.startRun())

  class FlowScene extends Phaser.Scene {
    constructor() { super('flow') }

    preload() {
      const base = import.meta.env.BASE_URL
      this.load.audio('disparo', `${base}assets/sonidos/disparo.wav`)
      this.load.audio('impacto', `${base}assets/sonidos/impacto.wav`)
      this.load.audio('error', `${base}assets/sonidos/error.wav`)
      this.load.audio('correccion', `${base}assets/sonidos/correccion.wav`)
    }

    create() {
      currentScene = this
      this.mode = 'title'
      this.wave = 1
      this.lives = 5
      this.score = 0
      this.detected = 0
      this.corrected = 0
      this.lost = 0
      this.combo = 0
      this.congested = false
      this.hitStopMs = 0
      this.bitErrors = 0
      this.totalBits = 0
      this.selectedBall = 'parity'
      this.upgrades = { rapid: 0, multi: 0, shield: 0 }
      this.blocks = []
      this.shots = []
      this.particles = []
      this.aim = -Math.PI / 2
      this.fireCooldown = 0
      this.poseTracking = false
      this.poseX = W / 2
      this.poseAim = -Math.PI / 2
      this.spawnTimer = 0
      this.spawned = 0
      this.waveTotal = 0
      this.boss = null
      this.lastTime = 0
      this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,A,F,SPACE,ONE,TWO,THREE,ENTER,ESC,UP,DOWN')
      this.pointerFire = false
      this.input.on('pointerdown', (p) => { if (this.mode === 'title') this.startRun(); else if (this.mode === 'playing') this.fire() })
      this.drawBackground()
      this.renderTitle()
      this.events.once('shutdown', () => { currentScene = null })
    }

    drawBackground() {
      const g = this.add.graphics()
      g.fillGradientStyle(COLORS.bg, COLORS.bg, 0x101d2c, 0x101d2c, 1); g.fillRect(0, 0, W, H)
      g.lineStyle(1, 0x143044, 0.45)
      for (let x = 0; x <= W; x += 48) g.lineBetween(x, 0, x, H)
      for (let y = 0; y <= H; y += 48) g.lineBetween(0, y, W, y)
      g.lineStyle(1, COLORS.cyan, 0.12)
      for (let y = 40; y < H; y += 130) g.lineBetween(0, y, W, y)
      this.bg = g
      this.stars = Array.from({ length: 52 }, () => this.add.circle(Math.random() * W, Math.random() * H, Math.random() * 1.7 + 0.5, COLORS.cyan, Math.random() * 0.38 + 0.08))
      this.add.rectangle(W / 2, H - 20, W, 40, 0x091725, 0.95)
      this.add.rectangle(W / 2, H - 40, W, 1, COLORS.cyan, 0.25)
      this.damageFrame = this.add.graphics().setDepth(20).setAlpha(0)
      this.damageFrame.lineStyle(11, COLORS.red, 0.95); this.damageFrame.strokeRect(7, 7, W - 14, H - 14)
      this.damageFrame.lineStyle(28, COLORS.red, 0.22); this.damageFrame.strokeRect(1, 1, W - 2, H - 2)
    }

    text(x, y, value, size = 16, color = '#eaf8ff', options = {}) {
      const { originX, originY, ...style } = options
      const text = this.add.text(x, y, value, { fontFamily: 'Consolas, monospace', fontSize: `${size}px`, color, ...style })
      if (originX !== undefined || originY !== undefined) text.setOrigin(originX ?? 0, originY ?? 0)
      return text
    }

    renderTitle() {
      this.mode = 'title'
      this.titleShade = this.add.rectangle(W / 2, H / 2, W, H, 0x06111e, 0.62)
      this.titleTop = this.text(W / 2, 150, 'SIMULADOR DE INTEGRIDAD // 001', 13, '#18e6e1', { originX: 0.5, letterSpacing: 3 })
      this.titleMain = this.text(W / 2, 205, 'TRAMAS Y BLOQUES', 43, '#eaf8ff', { originX: 0.5, fontStyle: 'bold', letterSpacing: 3 })
      this.titleSub = this.text(W / 2, 263, 'EL RUIDO ESTÁ EN LA LÍNEA. ¿PUEDES DETECTARLO?', 13, '#8da6b9', { originX: 0.5, letterSpacing: 1 })
      this.titlePrompt = this.text(W / 2, 352, 'CONFIGURA TU LOADOUT PARA INICIAR', 15, '#18e6e1', { originX: 0.5 })
      this.titleHelp = this.text(W / 2, 390, '5 oleadas · 5 vidas · usa cámara o teclado', 12, '#8da6b9', { originX: 0.5 })
      this.tweens.add({ targets: this.titlePrompt, alpha: 0.25, duration: 720, yoyo: true, repeat: -1 })
    }

    clearTitle() {
      ;['titleShade', 'titleTop', 'titleMain', 'titleSub', 'titlePrompt', 'titleHelp'].forEach((key) => { this[key]?.destroy(); this[key] = null })
    }

    startRun() {
      if (this.mode === 'results') {
        this.clearResults()
        this.renderTitle()
        loadoutPanel.classList.remove('is-hidden')
        return
      }
      if (this.mode !== 'title') return
      if (!loadoutSelection.balls.length) return
      loadoutPanel.classList.add('is-hidden')
      this.clearResults()
      this.clearTitle()
      this.poseTracking = false
      this.actor?.destroy(); this.hud?.destroy(); this.bufferText?.destroy(); this.aimGraphics?.destroy()
      this.blocks?.forEach((block) => block.container.destroy())
      this.shots?.forEach((shot) => { shot.dot?.destroy(); shot.aura?.destroy() })
      this.toast?.destroy()
      this.wave = 1; this.lives = 5; this.score = 0; this.detected = 0; this.corrected = 0; this.lost = 0; this.bitErrors = 0; this.totalBits = 0
      this.combo = 0; this.congested = false; this.hitStopMs = 0
      this.upgrades = { rapid: 0, multi: 0, shield: 0 }; this.upgrades[loadoutSelection.perk] = 1
      this.equippedBalls = [...loadoutSelection.balls]
      this.selectedBall = this.equippedBalls[0]
      this.blocks = []; this.shots = []; this.boss = null
      this.player = { x: W / 2, y: H - 72, radius: 18 }
      this.actor = this.add.container(this.player.x, this.player.y)
      const glow = this.add.circle(0, 5, 31, COLORS.cyan, 0.11)
      const body = this.add.rectangle(0, 0, 48, 35, 0x123048, 1).setStrokeStyle(2, COLORS.cyan, 0.85)
      const antenna = this.add.triangle(0, -19, 0, 16, 7, 0, 14, 16, COLORS.cyan, 0.95)
      const base = this.add.rectangle(0, 23, 70, 7, COLORS.cyan, 0.8)
      this.actor.add([glow, body, antenna, base])
      this.aimGraphics = this.add.graphics()
      this.hud = this.add.container(0, 0)
      this.hud.add([this.text(24, 17, 'OLEADA', 11, '#78909f'), this.text(24, 34, '', 19, '#18e6e1', { fontStyle: 'bold' })]); this.waveText = this.hud.list[1]
      this.hud.add([this.text(172, 17, 'VIDAS', 11, '#78909f'), this.text(172, 37, '', 15, '#ff416d')]); this.lifeText = this.hud.list[3]
      this.hud.add([this.text(306, 17, 'TRAMAS DETECTADAS', 11, '#78909f'), this.text(306, 37, '', 15, '#eaf8ff')]); this.detectText = this.hud.list[5]
      this.hud.add([this.text(510, 17, 'CORREGIDAS', 11, '#78909f'), this.text(510, 37, '', 15, '#ffcb57')]); this.fixedText = this.hud.list[7]
      this.hud.add([this.text(702, 17, 'PUNTOS', 11, '#78909f'), this.text(702, 37, '', 15, '#eaf8ff')]); this.scoreText = this.hud.list[9]
      this.hud.add([this.text(812, 17, 'RÁFAGA', 10, '#78909f'), this.text(812, 36, '0', 14, '#6bff9f')]); this.comboText = this.hud.list[11]
      this.bufferText = this.text(24, 59, 'BUFFER 0 / 5', 9, '#78909f')
      this.hud.add([this.text(948, 18, 'ESC PAUSA', 10, '#78909f', { originX: 1 })])
      this.wave = 1; this.beginWave()
      this.mode = 'playing'
    }

    beginWave() {
      this.waveTotal = this.wave === 5 ? 9 : 6 + this.wave * 2
      this.spawned = 0
      this.spawnTimer = 0.5
      this.boss = null
      if (this.wave === 5) this.spawnBoss()
      this.updateHud()
      this.showToast(this.wave === 5 ? 'ALERTA: TRAMA MASIVA' : `OLEADA ${String(this.wave).padStart(2, '0')} // INICIADA`)
    }

    showToast(label) {
      this.toast?.destroy()
      this.toast = this.text(W / 2, 82, label, 16, '#18e6e1', { originX: 0.5, fontStyle: 'bold', letterSpacing: 2 })
      this.tweens.add({ targets: this.toast, alpha: 0, delay: 1200, duration: 600, onComplete: () => this.toast?.destroy() })
    }

    updateHud() {
      if (!this.hud) return
      this.waveText.setText(`${this.wave} / 5`)
      this.lifeText.setText('◆ '.repeat(Math.max(0, this.lives)) || '—')
      this.detectText.setText(`${this.detected}  ·  PERDIDAS ${this.lost}`)
      this.fixedText.setText(String(this.corrected))
      this.scoreText.setText(String(this.score).padStart(6, '0'))
      const activeBlocks = this.blocks?.filter((block) => block.alive).length ?? 0
      this.bufferText?.setText(`BUFFER ${activeBlocks} / 5${this.congested ? ' · CONGESTIÓN' : ''}`)
      this.bufferText?.setColor(this.congested ? '#ff416d' : '#78909f')
      this.comboText?.setText(this.combo >= 3 ? `${this.combo} · ×${this.comboMultiplier().toFixed(2)}` : String(this.combo))
    }

    loseLife(playError = true) {
      if (this.upgrades.shield > 0) {
        this.upgrades.shield--
        this.showToast('ESCUDO ACTIVADO · VIDA PROTEGIDA')
        this.updateHud()
        return false
      } else {
        this.lives--
        if (playError) this.sound.play('error')
      }
      this.updateHud()
      return true
    }

    comboMultiplier() { return Math.min(3, 1 + Math.floor(this.combo / 3) * 0.25) }

    recordCorruptKill() {
      this.combo++
      const multiplier = this.comboMultiplier()
      if (this.combo >= 3) this.showToast(`RÁFAGA DE ENLACE ×${multiplier.toFixed(2)}`)
      this.updateHud()
      return multiplier
    }

    breakCombo() {
      if (!this.combo) return
      this.combo = 0
      this.showToast('RÁFAGA INTERRUMPIDA')
      this.updateHud()
    }

    triggerHitStop(duration = 70) {
      this.hitStopMs = Math.max(this.hitStopMs, duration)
    }

    triggerDamageFeedback() {
      this.cameras.main.shake(180, 0.006)
      this.tweens.killTweensOf(this.damageFrame)
      this.damageFrame.setAlpha(0.95)
      this.tweens.add({ targets: this.damageFrame, alpha: 0, duration: 320, ease: 'Quad.Out' })
    }

    createBlock(x, y, corrupted, boss = false, hp = 1) {
      this.totalBits += 8
      if (corrupted) this.bitErrors++
      const w = boss ? 188 : 102; const h = boss ? 82 : 53
      const container = this.add.container(x, y)
      const gfx = this.add.graphics()
      gfx.fillStyle(boss ? 0x381b35 : (corrupted ? 0x301c32 : 0x102c39), 0.98)
      gfx.lineStyle(2, boss ? 0xff416d : (corrupted ? COLORS.red : COLORS.cyan), 0.85)
      gfx.fillRoundedRect(-w / 2, -h / 2, w, h, 7); gfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 7)
      gfx.lineStyle(1, 0xffffff, 0.11)
      gfx.lineBetween(-w / 2 + 8, -h / 2 + 9, w / 2 - 8, -h / 2 + 9)
      container.add(gfx)
      const bits = []
      const count = boss ? 8 : 8; const bitW = boss ? 15 : 8; const gap = boss ? 5 : 3
      const startX = -((count * bitW + (count - 1) * gap) / 2)
      const badBit = corrupted ? Phaser.Math.Between(0, count - 1) : -1
      for (let i = 0; i < count; i++) {
        const isBad = i === badBit
        const rect = this.add.rectangle(startX + i * (bitW + gap) + bitW / 2, boss ? 5 : 2, bitW, boss ? 21 : 16, isBad ? COLORS.red : (boss ? 0xff7891 : COLORS.cyan), isBad ? 1 : 0.78)
        container.add(rect); bits.push(rect)
      }
      const label = this.add.text(0, -h / 2 + 15, boss ? `TRAMA MASIVA  ·  ${hp}` : (corrupted ? 'ERROR DETECTADO' : 'TRAMA ÍNTEGRA'), { fontFamily: 'Consolas, monospace', fontSize: boss ? '10px' : '8px', color: corrupted ? '#ff8ba5' : '#78dedc', letterSpacing: 1 }).setOrigin(0.5)
      container.add(label)
      const item = { x, y, w, h, corrupted, boss, hp, speed: boss ? 13 : 27 + this.wave * 6, container, bits, label, alive: true, badBit }
      this.blocks.push(item)
      if (boss) this.boss = item
      return item
    }

    spawnBoss() {
      this.createBlock(W / 2, 115, true, true, 12)
      this.spawned = 1
    }

    spawnBlock() {
      if (this.spawned >= this.waveTotal) return
      const corrupted = Math.random() < 0.47
      this.createBlock(90 + Math.random() * (W - 180), -35, corrupted)
      this.spawned++
    }

    fire() {
      if (this.mode !== 'playing' || this.fireCooldown > 0) return
      this.sound.play('disparo')
      const spec = TYPE[this.selectedBall]
      const angle = this.aim
      const speed = this.selectedBall === 'crc' ? 390 : 420
      const vx = Math.cos(angle) * speed; const vy = Math.sin(angle) * speed
      const shot = { x: this.player.x, y: this.player.y - 18, vx, vy, type: this.selectedBall, bounces: 0, radius: this.selectedBall === 'hamming' ? 8 : 6, alive: true, hits: new Set() }
      shot.dot = this.add.circle(shot.x, shot.y, shot.radius, spec.color, 1).setStrokeStyle(2, 0xffffff, 0.75)
      shot.aura = this.add.circle(shot.x, shot.y, shot.radius + 5, spec.color, 0.14)
      this.shots.push(shot)
      this.fireCooldown = Math.max(0.11, 0.34 - this.upgrades.rapid * 0.055)
      if (this.upgrades.multi > 0) {
        for (const offset of [-0.09, 0.09]) {
          const spread = { ...shot, x: this.player.x, y: this.player.y - 18, vx: Math.cos(angle + offset) * speed, vy: Math.sin(angle + offset) * speed, hits: new Set() }
          spread.dot = this.add.circle(spread.x, spread.y, spread.radius, spec.color, 1).setStrokeStyle(2, 0xffffff, 0.75); spread.aura = this.add.circle(spread.x, spread.y, spread.radius + 5, spec.color, 0.14); this.shots.push(spread)
        }
      }
    }

    hitBlock(shot, block) {
      if (!block.alive || shot.hits.has(block)) return
      shot.hits.add(block)
      if (shot.type === 'hamming') this.triggerHitStop(65)
      if (shot.type === 'hamming') {
        this.sound.play('correccion')
        if (block.corrupted) {
          block.corrupted = false; block.badBit = -1; block.container.list.forEach((child) => { if (child.type === 'Rectangle' && child.width < 20) child.setFillStyle(COLORS.green, 0.9) })
          block.label.setText(block.boss ? `REPARANDO  ·  ${block.hp}` : 'ERROR CORREGIDO')
          block.label.setColor('#6bff9f'); this.corrected++; this.score += block.boss ? 30 : 125; this.emitCorrectionEffect(block.x, block.y)
        } else { this.sound.play('error'); this.breakCombo(); this.score = Math.max(0, this.score - 25); this.emitBurst(block.x, block.y, COLORS.red) }
        this.destroyShot(shot)
      } else if (!block.corrupted && !block.boss) {
        this.sound.play('error'); this.breakCombo(); this.loseLife(false); this.score = Math.max(0, this.score - 50); this.emitBurst(block.x, block.y, COLORS.red); this.removeBlock(block); this.destroyShot(shot); this.updateHud()
        if (this.lives <= 0) this.finishRun(false)
      } else if (block.boss) {
        block.hp--; block.label.setText(`TRAMA MASIVA  ·  ${block.hp}`); this.score += 20; this.emitBurst(block.x + Phaser.Math.Between(-35, 35), block.y + 10, TYPE[shot.type].color)
        if (block.hp <= 0) { this.sound.play('impacto', { detune: Phaser.Math.Between(-60, 60) }); this.triggerHitStop(100); const multiplier = this.recordCorruptKill(); this.removeBlock(block); this.score += Math.round(500 * multiplier); this.showToast('JEFE DESACTIVADO') }
        if (shot.type === 'crc') this.bounceShot(shot); else this.destroyShot(shot)
      } else {
        this.sound.play('impacto', { detune: Phaser.Math.Between(-60, 60) })
        this.detected++
        const multiplier = this.recordCorruptKill()
        if (shot.type === 'crc') { this.score += Math.round(90 * multiplier); this.removeBlock(block); this.bounceShot(shot) }
        else { this.score += Math.round(60 * multiplier); this.removeBlock(block); this.destroyShot(shot) }
      }
      this.updateHud()
    }

    removeBlock(block) {
      if (!block.alive) return
      block.alive = false; block.container.destroy()
      if (block === this.boss) this.boss = null
    }

    destroyShot(shot) { shot.alive = false; shot.dot.destroy(); shot.aura.destroy() }
    bounceShot(shot) {
      shot.bounces++
      if (shot.bounces >= 3) { this.destroyShot(shot); return }
      if (Math.abs(shot.vx) > Math.abs(shot.vy)) shot.vx *= -1
      else shot.vy *= -1
      shot.hits.clear()
    }

    emitBurst(x, y, color) {
      for (let i = 0; i < 8; i++) {
        const p = this.add.circle(x, y, Phaser.Math.Between(2, 4), color, 0.95)
        this.tweens.add({ targets: p, x: x + Phaser.Math.Between(-36, 36), y: y + Phaser.Math.Between(-32, 32), alpha: 0, scale: 0.2, duration: 340, onComplete: () => p.destroy() })
      }
    }

    emitCorrectionEffect(x, y) {
      this.emitBurst(x, y, COLORS.green)
      for (let i = 0; i < 7; i++) {
        const bit = this.add.text(x + Phaser.Math.Between(-24, 24), y + Phaser.Math.Between(-12, 12), Math.random() > 0.5 ? '1' : '0', { fontFamily: 'Consolas, monospace', fontSize: '12px', color: '#6bff9f', fontStyle: 'bold' }).setOrigin(0.5).setDepth(6)
        this.tweens.add({ targets: bit, x: bit.x + Phaser.Math.Between(-38, 38), y: bit.y - Phaser.Math.Between(28, 58), alpha: 0, scale: 0.65, duration: 520, ease: 'Cubic.Out', onComplete: () => bit.destroy() })
      }
      this.triggerHitStop(65)
    }

    update(time, delta) {
      const dt = Math.min(delta / 1000, 0.04)
      this.stars?.forEach((s) => { s.y += dt * 12; if (s.y > H) { s.y = 0; s.x = Math.random() * W } })
      if (this.mode === 'title') { if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.ENTER)) this.startRun(); return }
      if (this.mode === 'paused') { if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) this.resume(); return }
      if (this.mode === 'upgrade' || this.mode === 'results') {
        if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.mode === 'upgrade' ? this.chooseUpgrade(0) : this.startRun()
        if (Phaser.Input.Keyboard.JustDown(this.keys.TWO) && this.mode === 'upgrade') this.chooseUpgrade(1)
        if (Phaser.Input.Keyboard.JustDown(this.keys.THREE) && this.mode === 'upgrade') this.chooseUpgrade(2)
        if (this.mode === 'results' && (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.ENTER))) this.startRun()
        return
      }
      if (this.mode !== 'playing') return
      if (this.hitStopMs > 0) {
        this.hitStopMs = Math.max(0, this.hitStopMs - delta)
        return
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) { this.pause(); return }
      this.fireCooldown = Math.max(0, this.fireCooldown - dt)
      if (window.poseControl?.active && this.poseTracking) {
        this.player.x = Phaser.Math.Linear(this.player.x, this.poseX, 0.38)
        this.aim = Phaser.Math.Linear(this.aim, this.poseAim, 0.32)
      } else {
        if (this.keys.LEFT.isDown) this.player.x -= 320 * dt
        if (this.keys.RIGHT.isDown) this.player.x += 320 * dt
        if (this.keys.A.isDown) this.aim = Math.max(-Math.PI + 0.2, this.aim - 1.65 * dt)
        if (this.keys.F.isDown) this.aim = Math.min(-0.2, this.aim + 1.65 * dt)
      }
      this.player.x = Phaser.Math.Clamp(this.player.x, 42, W - 42); this.actor?.setPosition(this.player.x, this.player.y)
      this.aimGraphics.clear(); this.aimGraphics.lineStyle(2, TYPE[this.selectedBall].color, 0.42); this.aimGraphics.lineBetween(this.player.x, this.player.y - 18, this.player.x + Math.cos(this.aim) * 63, this.player.y + Math.sin(this.aim) * 63 - 18)
      if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.selectBall(this.equippedBalls[0])
      if (Phaser.Input.Keyboard.JustDown(this.keys.TWO) && this.equippedBalls[1]) this.selectBall(this.equippedBalls[1])
      if (this.keys.SPACE.isDown) this.fire()
      if (this.spawned < this.waveTotal) {
        this.spawnTimer -= dt
        if (this.spawnTimer <= 0) { this.spawnBlock(); this.spawnTimer = Math.max(0.72, 1.55 - this.wave * 0.12) }
      }
      const queuedBlocks = this.blocks.filter((block) => block.alive).length
      if (!this.congested && queuedBlocks >= 5) { this.congested = true; this.showToast('BUFFER LLENO · CONGESTIÓN') ; this.updateHud() }
      else if (this.congested && queuedBlocks <= 2) { this.congested = false; this.showToast('BUFFER ESTABLE · FLUJO NORMAL'); this.updateHud() }
      for (const block of [...this.blocks]) {
        if (!block.alive) continue
        block.y += block.speed * (this.congested ? 1.5 : 1) * dt; block.container.y = block.y
        if (block.y >= H - 68 && !block.boss) {
          if (block.corrupted) {
            this.breakCombo()
            const lifeLost = this.loseLife()
            this.lost++
            this.emitBurst(block.x, H - 69, COLORS.red)
            if (lifeLost) this.triggerDamageFeedback()
          }
          this.removeBlock(block)
          if (this.lives <= 0) { this.finishRun(false); return }
        } else if (block.boss && block.y > 200) block.y = 200
      }
      for (const shot of [...this.shots]) {
        if (!shot.alive) continue
        shot.x += shot.vx * dt; shot.y += shot.vy * dt
        if (shot.type === 'crc' && (shot.x < 10 || shot.x > W - 10)) { shot.vx *= -1; shot.bounces++ }
        if (shot.type === 'crc' && shot.y < 12) { shot.vy *= -1; shot.bounces++ }
        if (shot.bounces >= 3 || shot.y < 0 || shot.y > H) { this.destroyShot(shot); continue }
        shot.dot.setPosition(shot.x, shot.y); shot.aura.setPosition(shot.x, shot.y)
        for (const block of this.blocks) {
          if (block.alive && Math.abs(shot.x - block.x) < block.w / 2 + shot.radius && Math.abs(shot.y - block.y) < block.h / 2 + shot.radius) { this.hitBlock(shot, block); if (this.mode !== 'playing') return; if (!shot.alive) break }
        }
      }
      if (this.spawned >= this.waveTotal && this.blocks.every((b) => !b.alive)) this.completeWave()
    }

    selectBall(type) {
      if (!type || !this.equippedBalls.includes(type)) return
      this.selectedBall = type
      cameraState.textContent = `Bola seleccionada: ${TYPE[type].name} · ${window.poseControl?.active ? 'Cámara activa' : 'Teclado listo'}`
    }

    completeWave() {
      if (this.wave >= 5) { this.finishRun(true); return }
      this.mode = 'upgrade'; this.showUpgrade()
    }

    showUpgrade() {
      this.overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x06111e, 0.88).setDepth(5)
      this.upgradeTitle = this.text(W / 2, 115, `OLEADA ${this.wave} COMPLETADA`, 15, '#18e6e1', { originX: 0.5, letterSpacing: 3 }).setDepth(6)
      this.upgradeHeading = this.text(W / 2, 155, 'Elige una mejora', 30, '#eaf8ff', { originX: 0.5, fontStyle: 'bold' }).setDepth(6)
      const choices = [
        { name: 'DISPARO RÁPIDO', desc: 'Reduce el tiempo entre disparos.', key: 'rapid', color: COLORS.cyan },
        { name: 'DOBLE PAQUETE', desc: 'Lanza dos bolas extra en abanico.', key: 'multi', color: COLORS.blue },
        { name: 'ESCUDO DE RED', desc: 'Una vez, evita perder una vida.', key: 'shield', color: COLORS.gold },
      ]
      this.upgradeButtons = choices.map((choice, index) => {
        const x = 180 + index * 300
        const box = this.add.rectangle(x, 288, 260, 164, 0x102235, 0.98).setStrokeStyle(2, choice.color, 0.75).setDepth(6).setInteractive({ useHandCursor: true })
        this.add.circle(x, 244, 17, choice.color, 0.18).setStrokeStyle(1, choice.color, 0.9).setDepth(7)
        this.text(x, 241, `${index + 1}`, 14, '#eaf8ff', { originX: 0.5, originY: 0.5 }).setDepth(8)
        this.text(x, 286, choice.name, 13, '#eaf8ff', { originX: 0.5, fontStyle: 'bold' }).setDepth(7)
        this.text(x, 317, choice.desc, 11, '#91aabc', { originX: 0.5, align: 'center', wordWrap: { width: 218 } }).setDepth(7)
        box.on('pointerover', () => box.setFillStyle(0x19334a)); box.on('pointerout', () => box.setFillStyle(0x102235)); box.on('pointerdown', () => this.chooseUpgrade(index))
        return box
      })
      this.text(W / 2, 420, 'LEVANTA LA MANO IZQUIERDA / DERECHA / AMBAS  ·  O PULSA 1, 2, 3', 10, '#78909f', { originX: 0.5, letterSpacing: 1 }).setDepth(6)
      this.upgradeSpecs = choices
    }

    chooseUpgrade(index) {
      if (this.mode !== 'upgrade') return
      const choice = this.upgradeSpecs[index]
      this.upgrades[choice.key]++
      this.overlay?.destroy(); this.upgradeTitle?.destroy(); this.upgradeHeading?.destroy(); this.upgradeButtons?.forEach((b) => b.destroy()); this.upgradeSpecs = null
      this.children.list.filter((child) => child.depth >= 6).forEach((child) => { if (child !== this.hud) child.destroy() })
      this.wave++; this.mode = 'playing'; this.beginWave()
    }

    pause() {
      this.mode = 'paused'
      this.pauseOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x06111e, 0.8).setDepth(9)
      this.pauseLabel = this.text(W / 2, H / 2 - 12, 'PAUSA', 30, '#eaf8ff', { originX: 0.5 }).setDepth(10)
      this.pauseHint = this.text(W / 2, H / 2 + 32, 'Pulsa ESC para continuar', 12, '#18e6e1', { originX: 0.5 }).setDepth(10)
    }

    resume() { this.pauseOverlay?.destroy(); this.pauseLabel?.destroy(); this.pauseHint?.destroy(); this.mode = 'playing' }

    finishRun(won) {
      if (this.mode === 'results') return
      this.mode = 'results'
      this.resultWon = won
      const ratio = this.totalBits ? Math.round(this.bitErrors / this.totalBits * 10000) / 100 : 0
      this.resultSummary = { initials: '', score: this.score, wave: this.wave, won, detected: this.detected, corrected: this.corrected, lost: this.lost, ber: ratio, date: new Date().toISOString() }
      this.resultOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x06111e, 0.9).setDepth(12)
      this.resultTitle = this.text(W / 2, 75, won ? 'RED ESTABLECIDA' : 'CONEXIÓN INTERRUMPIDA', 23, won ? '#18e6e1' : '#ff416d', { originX: 0.5, fontStyle: 'bold', letterSpacing: 2 }).setDepth(13)
      this.text(W / 2, 118, 'LO QUE PASÓ EN LA RED', 11, '#91aabc', { originX: 0.5, letterSpacing: 3 }).setDepth(13)
      const stats = `PUNTAJE       ${String(this.score).padStart(6, '0')}\nTRAMAS DETECTADAS     ${this.detected}\nTRAMAS CORREGIDAS     ${this.corrected}\nTRAMAS PERDIDAS       ${this.lost}\nBER FINAL             ${ratio.toFixed(2)}%`
      this.resultStats = this.text(W / 2, 158, stats, 14, '#eaf8ff', { originX: 0.5, align: 'left', lineSpacing: 8 }).setDepth(13)
      this.text(W / 2, 300, 'El control de errores ayuda a detectar fallos causados por ruido.\nLa paridad y CRC detectan errores; Hamming puede corregirlos\nsin retransmisión cuando el patrón de error lo permite.', 12, '#91aabc', { originX: 0.5, align: 'center', lineSpacing: 5 }).setDepth(13)
      this.initialsLabel = this.text(W / 2, 365, 'TUS INICIALES (3 LETRAS)', 10, '#18e6e1', { originX: 0.5, letterSpacing: 2 }).setDepth(13)
      const input = document.createElement('input'); input.className = 'initials-input'; input.maxLength = 3; input.value = 'NET'; input.setAttribute('aria-label', 'Iniciales para guardar puntaje'); document.querySelector('.game-frame').append(input); this.initialsInput = input
      this.exportButton = document.createElement('button'); this.exportButton.className = 'export-button'; this.exportButton.textContent = 'GUARDAR JSON'; document.querySelector('.game-frame').append(this.exportButton)
      this.exportButton.addEventListener('click', () => this.saveResult())
      this.resultPrompt = this.text(W / 2, 445, 'ESPACIO / ENTER PARA PREPARAR OTRA PARTIDA', 11, '#18e6e1', { originX: 0.5 }).setDepth(13)
      this.resultHint = this.text(W / 2, 472, 'El resultado también queda guardado en este navegador.', 10, '#78909f', { originX: 0.5 }).setDepth(13)
      this.saveToStorage()
    }

    saveToStorage() {
      try {
        const scores = JSON.parse(localStorage.getItem('tramas-y-bloques-scores') || '[]')
        const existing = scores.findIndex((entry) => entry.date === this.resultSummary.date)
        if (existing >= 0) scores[existing] = this.resultSummary
        else scores.unshift(this.resultSummary)
        localStorage.setItem('tramas-y-bloques-scores', JSON.stringify(scores.slice(0, 20), null, 2))
      } catch (error) { console.warn('No fue posible guardar el resultado localmente.', error) }
    }

    clearResults() {
      this.initialsInput?.remove(); this.exportButton?.remove()
      this.initialsInput = null; this.exportButton = null; this.resultSummary = null
      this.children.list.filter((child) => child.depth >= 12).forEach((child) => child.destroy())
    }

    saveResult() {
      if (!this.resultSummary) return
      this.resultSummary.initials = (this.initialsInput?.value || 'NET').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'NET'
      this.saveToStorage()
      const blob = new Blob([JSON.stringify(this.resultSummary, null, 2)], { type: 'application/json' })
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `tramas-${this.resultSummary.initials}-${this.score}.json`; link.click(); URL.revokeObjectURL(link.href)
      this.exportButton.textContent = 'JSON DESCARGADO'
    }
  }

  const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: W, height: H, backgroundColor: '#08121f', antialias: true, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, render: { pixelArt: false, roundPixels: true }, scene: [FlowScene] })

  cameraButton.addEventListener('click', async () => {
    if (window.poseControl?.active) { window.poseControl.stop(); return }
    cameraButton.disabled = true; cameraState.textContent = 'Solicitando permiso de cámara…'
    let stream
    try {
      stream = await solicitarCamara()
      video.srcObject = stream; await video.play()
      const translator = new GestureTranslator()
      const worker = new Worker(`${import.meta.env.BASE_URL}vision.worker.js`)
      let resolveReady
      let rejectReady
      const ready = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject })
      const state = { active: true, ready: false, stream, worker, translator, raf: 0, lastVideoTime: -1, lastInferenceAt: 0, framePending: false, lastShot: 0, lastPoseAt: 0, startedAt: performance.now(), stop: null }
      state.stop = (message = 'Cámara desactivada · Teclado listo') => { state.active = false; cancelAnimationFrame(state.raf); worker.terminate(); stream.getTracks().forEach((track) => track.stop()); video.srcObject = null; cameraView.classList.remove('visible'); paintPoseSkeleton(null); cameraButton.disabled = false; cameraButton.innerHTML = '<span>◎</span> ACTIVAR CÁMARA <small>OPCIONAL</small>'; cameraState.textContent = message; if (currentScene) currentScene.poseTracking = false; window.poseControl = null }
      window.poseControl = state; cameraView.classList.add('visible'); cameraState.textContent = 'Preparando detector de cámara…'
      worker.onmessage = ({ data }) => {
        if (data.type === 'ready') { resolveReady(); return }
        if (data.type === 'error') {
          const error = new Error(data.message)
          if (!state.ready) rejectReady(error)
          else if (state.active) state.stop(`Falló MediaPipe: ${data.message.slice(0, 100)}`)
          return
        }
        if (data.type !== 'result' || !state.active) return
        state.framePending = false
        const { timestamp, poseLandmarks: marks, handLandmarks } = data
        const sample = translator.update(marks, W, handLandmarks?.length ? handLandmarks : null)
        lastGestureSample = sample
        paintPoseSkeleton(debugPanel.hidden ? null : marks)
        updateGestureDebug(sample)
        const visible = (landmark, threshold = DEFAULT_GESTURE_THRESHOLDS.wristVisibility) => landmark && (landmark.visibility === undefined || landmark.visibility >= threshold)
        if (sample.tracked && currentScene?.mode === 'playing') {
          currentScene.poseX = sample.playerX
          currentScene.poseAim = sample.aim
          currentScene.poseTracking = true; state.lastPoseAt = timestamp
          cameraState.textContent = sample.aimDetected ? 'Seguimiento activo · hombros mueven · muñeca derecha apunta · gira la izquierda para disparar' : 'Hombros detectados · muestra la mano derecha para apuntar'
          if (sample.throwPressed && timestamp - state.lastShot > 120) { currentScene.fire(); state.lastShot = timestamp }
        } else if (sample.tracked && currentScene?.mode === 'upgrade') {
          const leftUp = visible(marks[15], 0.15) && marks[15].y < marks[11].y - 0.06; const rightUp = visible(marks[16], 0.15) && marks[16].y < marks[12].y - 0.06
          if (leftUp && rightUp) currentScene.chooseUpgrade(2)
          else if (leftUp) currentScene.chooseUpgrade(0)
          else if (rightUp) currentScene.chooseUpgrade(1)
        }
      }
      worker.onerror = (event) => {
        const detail = event.message || 'Falló el proceso de visión en segundo plano.'
        if (state.ready) state.stop(`Falló MediaPipe: ${detail.slice(0, 100)}`)
        else rejectReady(new Error(detail))
      }
      worker.postMessage({ type: 'init', bundleUrl: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.cjs', wasmUrl: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm', poseModelUrl: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task', handModelUrl: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task' })
      await ready
      state.ready = true
      cameraButton.disabled = false; cameraButton.innerHTML = '<span>◉</span> DESACTIVAR CÁMARA'; cameraState.textContent = 'Cámara activa · análisis en segundo plano'
      stream.getVideoTracks()[0]?.addEventListener('ended', () => { if (state.active) state.stop() }, { once: true })
      const frame = (now) => {
        if (!state.active) return
        if (!state.framePending && video.currentTime !== state.lastVideoTime && now - state.lastInferenceAt >= 50) {
          state.lastVideoTime = video.currentTime
          state.lastInferenceAt = now
          state.framePending = true
          createImageBitmap(video, { resizeWidth: 320, resizeHeight: 240, resizeQuality: 'low' }).then((bitmap) => {
            if (state.active) worker.postMessage({ type: 'frame', timestamp: now, bitmap }, [bitmap])
            else { bitmap.close(); state.framePending = false }
          }).catch((error) => { state.framePending = false; console.warn('No fue posible capturar un cuadro de cámara.', error) })
        }
        if (currentScene?.mode === 'playing') {
          if (state.lastPoseAt && now - state.lastPoseAt > 1200) {
            currentScene.poseTracking = false
            cameraState.textContent = 'Seguimiento perdido · centra cabeza y hombros; teclado disponible'
          } else if (!state.lastPoseAt && now - state.startedAt > 3000) {
            cameraState.textContent = 'No detecto hombros · aléjate y centra el torso en cámara'
          }
        }
        state.raf = requestAnimationFrame(frame)
      }
      state.raf = requestAnimationFrame(frame)
    } catch (error) {
      console.error(error); window.poseControl?.stop?.(); stream?.getTracks().forEach((track) => track.stop()); video.srcObject = null; cameraView.classList.remove('visible'); cameraButton.disabled = false; window.poseControl = null
      const detail = error instanceof Error ? ` · ${error.message.slice(0, 90)}` : ''
      cameraState.textContent = error.name === 'NotAllowedError' ? 'Permiso denegado · Puedes jugar con teclado' : `No se pudo iniciar la cámara · comprueba conexión y permisos${detail}`
      cameraButton.innerHTML = '<span>◎</span> REINTENTAR CÁMARA <small>OPCIONAL</small>'
    }
  })

  window.addEventListener('keydown', (event) => {
    if (event.code === 'KeyD' && !event.repeat) { toggleGestureDebug(); return }
    if (['ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault()
  })
  window.addEventListener('beforeunload', () => { window.poseControl?.stop(); game.destroy(true) })
}
