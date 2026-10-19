import './style.css'
import { GestureTranslator, DEFAULT_GESTURE_THRESHOLDS } from './gestos/traductor.js'
import { solicitarCamara } from './vision/camara.js'
import { BALANCE } from './config/balance.js'
import { createRunLedger, calculateRunRates, calculateLedgerBer } from './sistemas/metrics.js'
import { renderBootError } from './ui/boot-error.js'
import { createGameConfig } from './escenas/game-config.js'
import { createObjectPool } from './entidades/object-pool.js'
import { comboScoreMultiplier } from './sistemas/combo.js'
import { collisionOverlapsAabb } from './sistemas/colisiones.js'
import { createGlobalKeyBinding } from './sistemas/global-keys.js'
import { audioControlsState } from './sistemas/audio-controls.js'
import { completeTutorial, readTutorialSeen } from './sistemas/tutorial-state.js'
import { clearGameStorage } from './sistemas/game-storage.js'
import { GAME_VERSION } from './config/version.js'
import { DEFAULT_ACCESSIBILITY, readValidatedStorage, validateAccessibility } from './sistemas/storage.js'
import { resolveTabFocus } from './sistemas/focus-trap.js'

const app = document.querySelector('#app')
app.innerHTML = `
  <main class="shell">
    <header class="topbar"><a class="brand" href="#" aria-label="Tramas y Bloques, inicio"><span class="brand-mark">▦</span> TRAMAS <b>Y</b> BLOQUES</a><div class="top-status"><span class="status-dot"></span> SISTEMA EN LÍNEA <span id="audio-status">· AUDIO: ON</span></div></header>
    <section class="game-layout">
      <div class="game-column">
        <div class="game-frame"><div id="game"></div><div class="scanline" aria-hidden="true"></div>
          <section class="main-menu" id="main-menu" aria-label="Menú principal"><span class="menu-mark">▦</span><h2>TRAMAS <b>Y</b> BLOQUES</h2><p>SIMULADOR DE INTEGRIDAD // 001</p><nav><button data-menu-action="play">JUGAR</button><button data-menu-action="how">CÓMO JUGAR</button><button data-menu-action="options">OPCIONES</button><button data-menu-action="scores">MEJORES PUNTAJES</button></nav><div class="menu-subpanel" id="menu-subpanel" hidden></div></section>
          <section class="loadout-panel is-hidden" id="loadout-panel" aria-label="Equipamiento antes de la partida">
            <div class="loadout-kicker">PREPARACIÓN DE ENLACE</div><h2>Elige tu loadout</h2>
            <p>Equipa hasta dos métodos de control y una ventaja inicial.</p>
            <div class="loadout-label">MÉTODOS · MÁXIMO 2</div>
            <div class="loadout-options">
              <button class="loadout-choice is-selected" data-loadout-ball="parity" aria-pressed="true"><i class="ball-icon parity"></i><b>Paridad</b><small>Impacto directo</small><span class="loadout-status">✓ Equipado</span></button>
              <button class="loadout-choice" data-loadout-ball="crc" aria-pressed="false"><i class="ball-icon crc"></i><b>CRC</b><small>Rebota hasta 3 veces</small><span class="loadout-status">Toca para equipar</span></button>
              <button class="loadout-choice is-selected" data-loadout-ball="hamming" aria-pressed="true"><i class="ball-icon hamming"></i><b>Hamming</b><small>Corrige y suma extra</small><span class="loadout-status">✓ Equipado</span></button>
            </div>
    <div class="loadout-label">DIFICULTAD</div>
            <div class="difficulty-options" role="group" aria-label="Dificultad"><button class="difficulty-choice" data-difficulty="easy">Fácil · 7 vidas</button><button class="difficulty-choice is-selected" data-difficulty="normal">Normal · 5 vidas</button><button class="difficulty-choice" data-difficulty="hard">Difícil · 3 vidas</button></div>
            <div class="loadout-label">VENTAJA INICIAL</div>
            <div class="perk-options"><button class="perk-choice is-selected" data-loadout-perk="rapid">Disparo rápido</button><button class="perk-choice" data-loadout-perk="multi">Doble paquete</button><button class="perk-choice" data-loadout-perk="shield">Escudo de red</button></div>
            <div class="loadout-actions"><button id="start-run" class="start-run">INICIAR PARTIDA <span>⏎</span></button><button id="loadout-back" class="loadout-back">VOLVER AL MENÚ</button></div>
          </section>
          <section class="tutorial-panel" id="tutorial-panel" hidden role="dialog" aria-modal="true"><span>PROTOCOLO DE ENTRENAMIENTO</span><h2>Antes de empezar</h2><p id="tutorial-message"></p><div><button id="tutorial-skip">SALTAR TUTORIAL</button><button id="tutorial-next">SIGUIENTE</button></div></section>
          <div class="global-control-notice" id="global-control-notice" role="status" aria-live="polite" hidden></div>
          <section class="pause-panel" id="pause-panel" hidden role="dialog" aria-modal="true"><h2>PAUSA</h2><button data-pause-action="resume">REANUDAR</button><button data-pause-action="options">OPCIONES</button><button data-pause-action="calibrate">RECALIBRAR CÁMARA</button><button data-pause-action="menu">SALIR AL MENÚ</button></section>
          <section class="upgrade-panel" id="upgrade-panel" hidden aria-label="Elige una mejora"></section>
        </div>
        <div class="below-game"><span><kbd>←</kbd> <kbd>→</kbd> mover</span><span><kbd>A</kbd> <kbd>F</kbd> apuntar</span><span><kbd>ESPACIO</kbd> disparar</span><span><kbd>1</kbd><kbd>2</kbd> cambiar método equipado</span><span><kbd>D</kbd> depuración</span><span><kbd>V</kbd> temblor</span><span><kbd>M</kbd> silencio</span></div>
      </div>
      <aside class="side-panel">
        <div class="panel-heading"><span class="eyebrow">PROTOCOLO ARCADE / 01</span><h1>Controla el flujo.</h1><p>Detecta las tramas corruptas. Deja pasar las sanas.</p></div>
        <div class="rule-card"><div class="card-icon">⌁</div><div><strong>Tu misión</strong><p>Destruye solo los paquetes con un bit rojo antes de que alcancen el nodo.</p></div></div>
        <details class="camera-section"><summary>CÁMARA · <span id="camera-summary-status">DESACTIVADA</span> · <span id="camera-shake-status">TEMBLOR ON</span></summary>
        <button class="camera-button" id="camera-button"><span>◎</span> ACTIVAR CÁMARA <small>OPCIONAL</small></button>
        <div class="camera-state" id="camera-state" role="status" aria-live="polite">Cámara desactivada · Teclado, ratón y gamepad disponibles</div>
        <div class="camera-tools"><button id="recalibrate-camera" disabled>RECALIBRAR</button><button id="toggle-preview" aria-pressed="true">OCULTAR VISTA</button></div>
        <div class="camera-view" id="camera-view"><video id="camera-preview" autoplay playsinline muted></video><canvas id="pose-skeleton" aria-label="Esqueleto detectado por la cámara"></canvas><div id="camera-calibration" class="camera-calibration" hidden><div class="calibration-guide"><span>COLOCA CABEZA Y HOMBROS AQUÍ</span><b id="calibration-countdown">3</b></div></div><span id="gesture-state" class="gesture-state">GESTO: —</span></div>
        </details>
        <details class="method-section"><summary>MÉTODO ACTIVO · <span id="method-summary-status">PARIDAD</span></summary><div id="method-state">En partida, pulsa 1 o 2 para cambiar.</div></details>
        <details class="accessibility-panel"><summary>ACCESIBILIDAD Y GESTOS</summary><small id="motion-preference-note" class="motion-preference-note" hidden>Tu sistema prefiere movimiento reducido. Se activó esta opción; puedes cambiarla aquí.</small><label>Suavizado <select id="setting-smoothing"><option value="0.82">Rápido</option><option value="0.58" selected>Equilibrado</option><option value="0.34">Suave</option></select></label><label>Zona muerta <input id="setting-deadzone" type="range" min="0.005" max="0.04" step="0.001" value="0.012"><output id="deadzone-value">0.012</output></label><label>Umbral temporal <input id="setting-temporal" type="range" min="80" max="500" step="20" value="140"><output id="temporal-value">140 ms</output></label><label><input id="setting-reduced-motion" type="checkbox"> Reducir movimiento (sin shake ni flashes)</label><label><input id="setting-crt" type="checkbox"> Distorsión CRT (scanlines y aberración)</label><label>Paleta <select id="setting-palette"><option value="default">Cian / rojo (predeterminada)</option><option value="contrast">Alto contraste</option><option value="blue-yellow">Azul / amarillo</option></select></label><label>Tamaño de texto <input id="setting-text-size" type="range" min="90" max="125" step="5" value="100"><output id="text-size-value">100%</output></label><label>Volumen <input id="setting-volume" type="range" min="0" max="100" step="5" value="70"><output id="volume-value">70%</output></label><button id="mute-toggle" class="mute-toggle" aria-pressed="false">SILENCIAR (M)</button><button id="replay-tutorial" class="mute-toggle">VER TUTORIAL DE NUEVO</button><a href="#reset-confirm" class="reset-settings">RESTABLECER AJUSTES</a><div id="reset-confirm" class="reset-confirm"><span>¿Restablecer ajustes guardados?</span><a id="reset-settings" class="reset-confirm-yes" href="#">Sí</a><a href="#" class="reset-cancel">No</a></div><small id="reset-settings-status" role="status" aria-live="polite"></small><small>El audio se habilita tras una interacción con la página, según la política de autoplay del navegador.</small><button id="settings-back" class="settings-back" hidden>VOLVER</button><small>Teclado y ratón siguen disponibles si la cámara se pierde o se deniega.</small></details>
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
    <section class="results-panel" id="results-panel" hidden aria-label="Resultados de la partida"></section>
    <footer class="footer"><span>TELEMÁTICA // CAPA DE ENLACE</span><span>CHROME / EDGE 115+ <b id="game-version">${GAME_VERSION}</b></span></footer>
  </main>`

const cameraButton = document.querySelector('#camera-button')
const cameraState = document.querySelector('#camera-state')
const cameraSection = document.querySelector('.camera-section')
const cameraSummaryStatus = document.querySelector('#camera-summary-status')
new MutationObserver(() => { cameraSummaryStatus.textContent = cameraState.textContent.toUpperCase().split(' · ')[0].slice(0, 30) }).observe(cameraState, { childList: true, characterData: true, subtree: true })
const video = document.querySelector('#camera-preview')
const cameraView = document.querySelector('#camera-view')
const skeletonCanvas = document.querySelector('#pose-skeleton')
const recalibrateButton = document.querySelector('#recalibrate-camera')
const togglePreviewButton = document.querySelector('#toggle-preview')
const calibrationOverlay = document.querySelector('#camera-calibration')
const calibrationCountdown = document.querySelector('#calibration-countdown')
const calibrationGuide = document.querySelector('.calibration-guide')
const calibrationInstruction = calibrationGuide.querySelector('span')
const gestureState = document.querySelector('#gesture-state')
const debugPanel = document.querySelector('#gesture-debug')
const debugPose = document.querySelector('#debug-pose')
const debugValues = document.querySelector('#debug-values')
const debugTrials = document.querySelector('#debug-trials')
const loadoutPanel = document.querySelector('#loadout-panel')
const mainMenu = document.querySelector('#main-menu')
const menuSubpanel = document.querySelector('#menu-subpanel')
const tutorialPanel = document.querySelector('#tutorial-panel')
const pausePanel = document.querySelector('#pause-panel')
const resultsPanel = document.querySelector('#results-panel')
const upgradePanel = document.querySelector('#upgrade-panel')
const focusableSelector = 'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])'
function isPanelVisible(panel) {
  if (!panel) return false
  if (panel === loadoutPanel) return !panel.classList.contains('is-hidden')
  return !panel.hidden
}
function activeModalPanel() {
  return [upgradePanel, resultsPanel, tutorialPanel, pausePanel, loadoutPanel, mainMenu].find(isPanelVisible) ?? null
}
function focusPanel(panel, selector = focusableSelector) {
  if (!panel) return
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-modal', 'true')
  if (!panel.hasAttribute('tabindex')) panel.tabIndex = -1
  requestAnimationFrame(() => {
    if (!isPanelVisible(panel)) return
    const target = selector === focusableSelector
      ? getVisibleFocusable(panel)[0]
      : [...panel.querySelectorAll(selector)].find((element) => isFocusableVisible(element))
    ;(target && !target.disabled ? target : panel).focus({ preventScroll: true })
  })
}
function isFocusableVisible(element) {
  return Boolean(element.getClientRects().length && !element.closest('[hidden], [inert], [aria-hidden="true"]'))
}
function getVisibleFocusable(panel) {
  return [...panel.querySelectorAll(focusableSelector)].filter(isFocusableVisible)
}
document.addEventListener('focusin', (event) => {
  const panel = activeModalPanel()
  if (!panel || panel.contains(event.target)) return
  const target = getVisibleFocusable(panel)[0]
  ;(target ?? panel).focus({ preventScroll: true })
}, true)
function focusGameCanvas() {
  const canvas = document.querySelector('#game canvas')
  if (canvas) { canvas.tabIndex = 0; canvas.focus({ preventScroll: true }) }
}
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return
  const panel = activeModalPanel()
  if (!panel) return
  const focusables = getVisibleFocusable(panel)
  const target = resolveTabFocus(focusables, document.activeElement, event.shiftKey, panel)
  if (target) { event.preventDefault(); target.focus({ preventScroll: true }) }
}, true)
const globalControlNotice = document.querySelector('#global-control-notice')
const reducedMotionInput = document.querySelector('#setting-reduced-motion')
const motionPreferenceNote = document.querySelector('#motion-preference-note')
const REDUCED_MOTION_CHOICE_KEY = 'tramas-reduced-motion-choice'
const tutorialMessage = document.querySelector('#tutorial-message')
const tutorialSteps = ['Destruye las tramas con el bit rojo: son paquetes corruptos.', 'No dispares a las tramas sanas con ✓. Golpearlas rompe tu racha y resta puntos o vida.', 'Muévete con ←/→, apunta con A/F y dispara con ESPACIO. Ratón, gamepad y cámara también funcionan.', 'Combina Paridad y CRC para detectar errores; Hamming puede corregirlos. Mantén la precisión para aumentar la ráfaga.']
let tutorialStep = 0
let returnFromOptions = 'menu'
const loadoutSelection = { balls: ['parity', 'hamming'], perk: 'rapid', difficulty: 'normal' }

function assessCalibrationPose(landmarks) {
  const left = landmarks?.[11]
  const right = landmarks?.[12]
  const visible = (point) => point && (point.visibility === undefined || point.visibility >= DEFAULT_GESTURE_THRESHOLDS.shoulderVisibility)
  if (!visible(left) || !visible(right)) return { visible: false, centered: false, centerX: null }
  const centerX = (left.x + right.x) / 2
  const shoulderSpan = Math.abs(right.x - left.x)
  return { visible: true, centered: centerX >= 0.37 && centerX <= 0.63 && shoulderSpan >= 0.1 && shoulderSpan <= 0.62, centerX }
}

const ACCESSIBILITY_KEY = 'tramas-accessibility-v1'
const ACCESSIBILITY_DEFAULTS = DEFAULT_ACCESSIBILITY
const accessibility = { ...ACCESSIBILITY_DEFAULTS }
try { Object.assign(accessibility, readValidatedStorage(localStorage, ACCESSIBILITY_KEY, validateAccessibility, { ...ACCESSIBILITY_DEFAULTS })) } catch {}
let reducedMotionWasDetected = false
try {
  if (localStorage.getItem(REDUCED_MOTION_CHOICE_KEY) !== 'user' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    accessibility.reducedMotion = true
    reducedMotionWasDetected = true
  }
} catch {}
function showControlNotice(message) {
  globalControlNotice.textContent = message
  globalControlNotice.hidden = false
  clearTimeout(showControlNotice.timer)
  showControlNotice.timer = setTimeout(() => { globalControlNotice.hidden = true }, 2600)
}
function applyAccessibility() {
  document.documentElement.style.setProperty('--text-scale', `${accessibility.textSize / 100}`)
  document.documentElement.dataset.palette = accessibility.palette
  document.documentElement.classList.toggle('reduce-motion', accessibility.reducedMotion)
  document.querySelector('.game-frame')?.classList.toggle('crt-enabled', accessibility.crt)
  const values = { 'setting-smoothing': accessibility.smoothing, 'setting-deadzone': accessibility.deadZone, 'setting-temporal': accessibility.temporalMs, 'setting-reduced-motion': accessibility.reducedMotion, 'setting-crt': accessibility.crt, 'setting-palette': accessibility.palette, 'setting-text-size': accessibility.textSize, 'setting-volume': accessibility.volume }
  for (const [id, value] of Object.entries(values)) { const input = document.querySelector(`#${id}`); if (input) input.type === 'checkbox' ? input.checked = Boolean(value) : input.value = String(value) }
  document.querySelector('#deadzone-value').value = Number(accessibility.deadZone).toFixed(3)
  document.querySelector('#temporal-value').value = `${accessibility.temporalMs} ms`
  document.querySelector('#text-size-value').value = `${accessibility.textSize}%`
  const audioControls = audioControlsState(accessibility.muted, accessibility.volume)
  const volumeSlider = document.querySelector('#setting-volume')
  if (volumeSlider) { volumeSlider.value = String(audioControls.effectiveVolume); volumeSlider.disabled = accessibility.muted; volumeSlider.setAttribute('aria-valuetext', audioControls.volumeDescription) }
  document.querySelector('#volume-value').value = audioControls.volumeText
  if (window.gameInstance?.sound) window.gameInstance.sound.volume = accessibility.volume / 100
  if (window.gameInstance?.sound) window.gameInstance.sound.mute = accessibility.muted
  const muteButton = document.querySelector('#mute-toggle')
  if (muteButton) { muteButton.textContent = audioControls.button; muteButton.setAttribute('aria-pressed', String(audioControls.buttonPressed)) }
  const audioStatus = document.querySelector('#audio-status')
  if (audioStatus) audioStatus.textContent = audioControls.header
  if (window.poseControl?.translator) window.poseControl.translator.configure({ smoothingAlpha: accessibility.smoothing, moveDeadZone: accessibility.deadZone })
  if (motionPreferenceNote) motionPreferenceNote.hidden = !reducedMotionWasDetected
  const scene = window.gameInstance?.scene?.getScene?.('flow')
  if (scene) { scene.setReducedMotion?.(accessibility.reducedMotion); scene.syncFallbackAudioVolume?.(); scene.updateAudioStatus?.() }
}
function saveAccessibility() {
  Object.assign(accessibility, validateAccessibility(accessibility))
  try { localStorage.setItem(ACCESSIBILITY_KEY, JSON.stringify(accessibility)) } catch {}
  applyAccessibility()
}
function resetGameSettings() {
  clearGameStorage(localStorage)
  Object.assign(accessibility, ACCESSIBILITY_DEFAULTS)
  reducedMotionWasDetected = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  if (reducedMotionWasDetected) accessibility.reducedMotion = true
  for (const key of Object.keys(gestureTrials)) {
    gestureTrials[key].success = 0
    gestureTrials[key].failure = 0
    gestureTrials[key].falsePositive = 0
  }
  renderGestureTrials()
  applyAccessibility()
  if (window.poseControl?.translator) window.poseControl.translator.configure({ smoothingAlpha: accessibility.smoothing, moveDeadZone: accessibility.deadZone })
  const scene = window.gameInstance?.scene?.getScene?.('flow')
  if (scene) { scene.screenShakeEnabled = true; scene.updateShakeIndicator?.() }
  document.querySelector('#reset-settings-status').textContent = 'Ajustes restablecidos. Se borraron los datos guardados del juego.'
}
function resumeAudioFromUserGesture() {
  const sound = window.gameInstance?.sound
  if (!sound) return
  sound.mute = accessibility.muted
  const context = sound.context
  const resumed = context?.state === 'suspended' ? context.resume().catch(() => {}) : Promise.resolve()
  resumed.finally(() => window.gameInstance?.scene?.getScene?.('flow')?.resumeAudio?.())
}
for (const [id, key, parse] of [
  ['setting-smoothing', 'smoothing', Number], ['setting-deadzone', 'deadZone', Number], ['setting-temporal', 'temporalMs', Number], ['setting-palette', 'palette', String], ['setting-text-size', 'textSize', Number], ['setting-volume', 'volume', Number],
]) document.querySelector(`#${id}`).addEventListener('input', (event) => { accessibility[key] = parse(event.target.value); saveAccessibility(); if (window.poseControl?.translator) window.poseControl.translator.configure({ smoothingAlpha: accessibility.smoothing, moveDeadZone: accessibility.deadZone }) })
document.querySelector('#setting-crt').addEventListener('change', (event) => { accessibility.crt = event.target.checked; saveAccessibility() })
reducedMotionInput.addEventListener('change', (event) => { accessibility.reducedMotion = event.target.checked; reducedMotionWasDetected = false; try { localStorage.setItem(REDUCED_MOTION_CHOICE_KEY, 'user') } catch {}; saveAccessibility() })
togglePreviewButton.addEventListener('click', () => { cameraView.classList.toggle('preview-hidden'); const visible = !cameraView.classList.contains('preview-hidden'); togglePreviewButton.textContent = visible ? 'OCULTAR VISTA' : 'MOSTRAR VISTA'; togglePreviewButton.setAttribute('aria-pressed', String(visible)) })
document.querySelector('#mute-toggle').addEventListener('click', () => {
  resumeAudioFromUserGesture()
  const scene = window.gameInstance?.scene?.getScene?.('flow')
  if (scene?.toggleAudioMute) scene.toggleAudioMute()
  else { accessibility.muted = !accessibility.muted; saveAccessibility() }
})
document.querySelector('#replay-tutorial').addEventListener('click', () => {
  document.querySelector('.accessibility-panel').open = false
  document.querySelector('#settings-back').hidden = true
  window.gameInstance?.scene?.getScene('flow')?.openTutorialPreview(returnFromOptions === 'pause' ? 'pause-options' : 'options')
})
document.querySelector('#reset-settings').addEventListener('click', resetGameSettings)
document.querySelector('#settings-back').addEventListener('click', () => { document.querySelector('.accessibility-panel').open = false; document.querySelector('#settings-back').hidden = true; if (returnFromOptions === 'pause') { pausePanel.hidden = false; focusPanel(pausePanel, '[data-pause-action="resume"]') } else { mainMenu.hidden = false; focusPanel(mainMenu, '[data-menu-action="play"]') } })
document.querySelector('#loadout-back').addEventListener('click', () => { loadoutPanel.classList.add('is-hidden'); mainMenu.hidden = false; document.querySelector('.shell').classList.remove('in-run'); focusPanel(mainMenu, '[data-menu-action="play"]') })
document.querySelectorAll('[data-menu-action]').forEach((button) => button.addEventListener('click', () => {
  const action = button.dataset.menuAction
  if (action === 'play') { mainMenu.hidden = true; loadoutPanel.classList.remove('is-hidden'); document.querySelector('.shell').classList.add('in-run'); focusPanel(loadoutPanel, '#start-run'); return }
  if (action === 'options') { returnFromOptions = 'menu'; mainMenu.hidden = true; const panel = document.querySelector('.accessibility-panel'); panel.open = true; document.querySelector('#settings-back').hidden = false; panel.scrollIntoView({ behavior: accessibility.reducedMotion ? 'auto' : 'smooth', block: 'center' }); document.querySelector('#setting-smoothing').focus({ preventScroll: true }); return }
  menuSubpanel.hidden = false
  if (action === 'how') { menuSubpanel.hidden = true; window.gameInstance?.scene?.getScene('flow')?.openTutorialPreview('menu'); return }
  if (action === 'scores') { menuSubpanel.innerHTML = `<h3>MEJORES PUNTAJES</h3>${renderLeaderboard()}<button data-menu-back>VOLVER</button>`; menuSubpanel.querySelector('[data-menu-back]')?.focus() }
  menuSubpanel.querySelector('[data-menu-back]')?.addEventListener('click', () => { menuSubpanel.hidden = true; menuSubpanel.innerHTML = ''; focusPanel(mainMenu, '[data-menu-action="scores"]') })
}))
resultsPanel.addEventListener('click', (event) => {
  const button = event.target.closest('button')
  if (!button) return
  const scene = window.gameInstance?.scene?.getScene('flow')
  if (button.id === 'save-score') scene?.saveResult(false)
  if (button.id === 'export-result') scene?.saveResult(true)
  if (button.id === 'results-menu') scene?.returnToMenu()
  if (button.id === 'results-retry') scene?.restartRun()
})
resultsPanel.addEventListener('input', (event) => {
  if (event.target.id !== 'result-initials') return
  document.querySelector('#save-score').disabled = !/[A-Z]/i.test(event.target.value)
})
function renderLeaderboard(limit = 8) {
  let scores = []
  try { scores = JSON.parse(localStorage.getItem('tramas-y-bloques-scores') || '[]') } catch {}
  if (!scores.length) return '<p class="empty-scores">Aún no hay puntajes guardados.</p>'
  return `<table><thead><tr><th>#</th><th>INI</th><th>PUNTOS</th><th>OLEADA</th></tr></thead><tbody>${scores.slice().sort((a, b) => b.score - a.score).slice(0, limit).map((entry, i) => `<tr><td>${i + 1}</td><td>${String(entry.initials || '---').replace(/[^A-Z0-9-]/gi, '').slice(0, 3)}</td><td>${Number(entry.score) || 0}</td><td>${Number(entry.wave) || 1}</td></tr>`).join('')}</tbody></table>`
}
document.querySelector('#tutorial-next').addEventListener('click', () => window.gameInstance?.scene?.getScene('flow')?.advanceTutorial())
document.querySelector('#tutorial-skip').addEventListener('click', () => window.gameInstance?.scene?.getScene('flow')?.finishTutorial('skip'))
pausePanel.querySelectorAll('[data-pause-action]').forEach((button) => button.addEventListener('click', () => {
  const scene = window.gameInstance?.scene?.getScene('flow')
  if (button.dataset.pauseAction === 'resume') scene?.resume()
  if (button.dataset.pauseAction === 'calibrate') window.poseControl?.calibrate?.()
  if (button.dataset.pauseAction === 'menu') scene?.returnToMenu()
  if (button.dataset.pauseAction === 'options') { returnFromOptions = 'pause'; pausePanel.hidden = true; const panel = document.querySelector('.accessibility-panel'); panel.open = true; document.querySelector('#settings-back').hidden = false; panel.scrollIntoView({ behavior: accessibility.reducedMotion ? 'auto' : 'smooth', block: 'center' }); document.querySelector('#setting-smoothing').focus({ preventScroll: true }) }
}))
document.querySelector('#setting-temporal').addEventListener('input', (event) => { document.querySelector('#temporal-value').value = `${event.target.value} ms` })
document.querySelector('#setting-deadzone').addEventListener('input', (event) => { document.querySelector('#deadzone-value').value = Number(event.target.value).toFixed(3) })
document.querySelector('#setting-text-size').addEventListener('input', (event) => { document.querySelector('#text-size-value').value = `${event.target.value}%` })
document.querySelector('#setting-volume').addEventListener('input', (event) => { document.querySelector('#volume-value').value = `${event.target.value}%` })
applyAccessibility()
focusPanel(mainMenu, '[data-menu-action="play"]')

function renderLoadoutSelection() {
  document.querySelectorAll('[data-loadout-ball]').forEach((button) => {
    const selected = loadoutSelection.balls.includes(button.dataset.loadoutBall)
    button.classList.toggle('is-selected', selected)
    button.setAttribute('aria-pressed', String(selected))
    button.disabled = selected && loadoutSelection.balls.length <= 1
    const status = button.querySelector('.loadout-status')
    status.textContent = selected ? '✓ Equipado' : loadoutSelection.balls.length >= 2 ? 'Máximo 2 alcanzado · Toca para intercambiar' : 'Toca para equipar'
  })
  document.querySelectorAll('[data-loadout-perk]').forEach((button) => {
    const selected = button.dataset.loadoutPerk === loadoutSelection.perk
    button.classList.toggle('is-selected', selected)
    button.setAttribute('aria-pressed', String(selected))
  })
  document.querySelectorAll('[data-difficulty]').forEach((button) => {
    const selected = button.dataset.difficulty === loadoutSelection.difficulty
    button.classList.toggle('is-selected', selected)
    button.setAttribute('aria-pressed', String(selected))
  })
}

document.querySelectorAll('[data-loadout-ball]').forEach((button) => button.addEventListener('click', () => {
  const ball = button.dataset.loadoutBall
  if (loadoutSelection.balls.includes(ball)) loadoutSelection.balls = loadoutSelection.balls.filter((value) => value !== ball)
  else if (loadoutSelection.balls.length < 2) loadoutSelection.balls.push(ball)
  else loadoutSelection.balls.splice(0, 1, ball)
  renderLoadoutSelection()
}))
document.querySelectorAll('[data-loadout-perk]').forEach((button) => button.addEventListener('click', () => {
  loadoutSelection.perk = button.dataset.loadoutPerk
  renderLoadoutSelection()
}))
document.querySelectorAll('[data-difficulty]').forEach((button) => button.addEventListener('click', () => {
  loadoutSelection.difficulty = button.dataset.difficulty
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
  renderBootError(document.querySelector('#game'))
} else {
  const W = 960
  const H = 540
      const COLORS = { cyan: 0x18e6e1, red: 0xff416d, blue: 0x6979ff, gold: 0xffcb57, green: 0x6bff9f, white: 0xeaf8ff, muted: 0x78909f, bg: 0x08121f, panel: 0x0d1b2b }
  const TYPE = { parity: { name: 'PARIDAD', color: COLORS.cyan }, crc: { name: 'CRC', color: COLORS.blue }, hamming: { name: 'HAMMING', color: COLORS.gold } }
  let currentScene
  const globalKeys = createGlobalKeyBinding(window, {
    toggleMute: () => { resumeAudioFromUserGesture(); if (currentScene?.toggleAudioMute) currentScene.toggleAudioMute(); else { accessibility.muted = !accessibility.muted; saveAccessibility() } },
    toggleShake: () => currentScene?.toggleScreenShake(),
    isReducedMotion: () => accessibility.reducedMotion,
    onMotionBlocked: () => showControlNotice('Temblor bloqueado por Reducir movimiento'),
    toggleDebug: toggleGestureDebug,
    escape: () => {
      if (currentScene?.mode === 'tutorial') { currentScene.finishTutorial('skip'); return }
      if (!document.querySelector('#settings-back').hidden) { document.querySelector('#settings-back').click(); return }
      if (!loadoutPanel.classList.contains('is-hidden')) { document.querySelector('#loadout-back').click(); return }
      if (currentScene?.mode === 'playing') currentScene.pause()
      else if (currentScene?.mode === 'paused') currentScene.resume()
      else if (currentScene?.mode === 'results') currentScene.returnToMenu()
      else if (!menuSubpanel.hidden) { menuSubpanel.hidden = true; menuSubpanel.innerHTML = '' }
    },
  })
  window.addEventListener('start-game-run', () => currentScene?.startRun())

  class FlowScene extends Phaser.Scene {
    constructor() { super('flow') }

    preload() {
      const base = import.meta.env.BASE_URL
      const sounds = {
        disparo: 'disparo.wav', impacto: 'impacto.wav', correccion: 'correccion.wav', error: 'error.wav',
        rebote: 'rebote.wav', mejora: 'mejora.wav', victoria: 'victoria.wav', derrota: 'derrota.wav', jefe: 'jefe.wav', bgm: 'bgm.mp3',
      }
      this.audioKeys = new Set(Object.keys(sounds))
      this.missingAudio = new Set()
      this.load.on('loaderror', (file) => { if (this.audioKeys.has(file.key)) this.missingAudio.add(file.key) })
      const sprites = [
        ['sprite-node', 'protagonista_quieto.png', 64, 64],
        ['sprite-healthy', 'trama_sana_bajando.png', 64, 32],
        ['sprite-corrupt', 'trama_corrupta_error.png', 64, 32],
        ['sprite-boss', 'jefe_masivo.png', 192, 96],
        ['sprite-projectiles', 'proyectiles_tipos.png', 32, 32],
        ['sprite-far', 'fondo_lejano.png', 1280, 720],
        ['sprite-parallax', 'fondo_parallax.png', 1280, 720],
        ['sprite-near', 'fondo_cercano.png', 1280, 720],
        ['sprite-circuits', 'tileset_circuitos.png', 256, 256],
        ['sprite-ui', 'ui_elementos.png', 512, 64],
      ]
      for (const [key, file, frameWidth, frameHeight] of sprites) {
        this.load.spritesheet(key, `${base}assets/sprites/${file}`, { frameWidth, frameHeight })
      }
      for (const [key, file] of Object.entries(sounds)) this.load.audio(key, `${base}assets/sonidos/${file}`)
    }

    create() {
      currentScene = this
      this.mode = 'title'
      this.audioContextFallback = null
      this.audioFallbackMaster = null
      this.fallbackBgmOscillators = []
      this.fallbackMusicTimer = null
      this.fallbackMusicStep = 0
      this.fallbackMusicNextAt = 0
      this.musicRate = 1
      this.bgmFallbackRequested = false
      this.musicStarted = false
      this.wave = 1
      this.lives = BALANCE.player.lives
      this.score = 0
      this.detected = 0
      this.corrected = 0
      this.lost = 0
      this.combo = 0
      this.congested = false
      this.hitStopMs = 0
      this.invulnMs = 0
      this.screenShakeEnabled = localStorage.getItem('tramas-screen-shake') !== 'false'
      this.reducedMotion = accessibility.reducedMotion
      this.slowMotionMs = 0
      this.ledger = createRunLedger(); this.metrics = this.ledger.totals; this.waveMetrics = this.ledger.waves
      this.selectedBall = 'parity'
      this.upgrades = { rapid: 0, multi: 0, shield: 0, pierce: 0, hammingArea: 0, bigBall: 0, slowBlocks: 0, scoreMagnet: 0, extraLife: 0 }
      this.difficulty = BALANCE.difficulty.normal
      this.shotHeat = 0
      this.blocks = []
      this.shots = []
      this.maxParticles = 128
      this.maxShots = 36
      this.maxBlocks = 64
      this.blockPool = createObjectPool(() => this.createBlockDisplay(), this.maxBlocks)
      this.shotPool = createObjectPool(() => ({ hits: new Set() }), this.maxShots)
      this.projectileVisualPool = createObjectPool(() => this.createProjectileVisualEntry(), this.maxShots)
      this.particlePool = createObjectPool(() => this.add.circle(0, 0, 2, 0xffffff, 0).setActive(false).setVisible(false).setDepth(7), this.maxParticles)
      this.activeParticles = new Set()
      this.bitParticlePool = createObjectPool(() => this.add.text(0, 0, '0', { fontFamily: 'IBM Plex Mono, Consolas, monospace', fontSize: '12px', color: '#6bff9f', fontStyle: 'bold' }).setOrigin(0.5).setDepth(8).setActive(false).setVisible(false), 24)
      this.distortionPulsePool = createObjectPool(() => this.add.circle(0, 0, 8, 0x42aaff, 0.035).setStrokeStyle(2, 0x72cbff, 0.9).setDepth(8).setActive(false).setVisible(false), 12)
      // Construye una vez el cupo máximo para evitar crear display objects a mitad de una oleada.
      for (const pool of [this.blockPool, this.shotPool, this.projectileVisualPool, this.particlePool, this.bitParticlePool, this.distortionPulsePool]) pool.prewarm()
      this.activeBitParticles = new Set()
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
      this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,A,F,SPACE,ONE,TWO,THREE,ENTER,UP,DOWN')
      this.pointerFire = false
      this.input.on('pointerdown', (p) => { if (this.mode === 'title') this.startRun(); else if (this.mode === 'playing') this.fire() })
      this.input.on('pointermove', (pointer) => { if (this.mode === 'playing' && !window.poseControl?.active && (pointer.isDown || pointer.wasMoved)) this.aim = Phaser.Math.Clamp(Math.atan2(pointer.worldY - this.player.y, pointer.worldX - this.player.x), -Math.PI + 0.2, -0.2) })
      this.drawBackground()
      this.startBackgroundMusic()
      this.createOptionalAnimations()
      this.renderTitle()
      globalKeys.register()
      this.updateShakeIndicator()
      this.events.once('shutdown', () => {
        globalKeys.unregister()
        clearInterval(this.fallbackMusicTimer); this.fallbackMusicTimer = null
        this.fallbackBgmOscillators.forEach(({ oscillator }) => { try { oscillator.stop() } catch {} }); this.fallbackBgmOscillators = []
        for (const pool of [this.blockPool, this.shotPool, this.projectileVisualPool, this.particlePool, this.bitParticlePool, this.distortionPulsePool]) pool?.clear()
        this.activeParticles.clear(); this.activeBitParticles.clear(); this.blocks.length = 0; this.shots.length = 0
        if (currentScene === this) currentScene = null
      })
    }

    updateAudioStatus() {
      const state = audioControlsState(this.sound.mute, accessibility.volume)
      this.audioStatusText?.setText(state.header.replace(/^· /, ''))
      const status = document.querySelector('#audio-status')
      if (status) status.textContent = state.header
      const button = document.querySelector('#mute-toggle')
      if (button) { button.textContent = state.button; button.setAttribute('aria-pressed', String(state.buttonPressed)) }
      const slider = document.querySelector('#setting-volume')
      if (slider) { slider.value = String(state.effectiveVolume); slider.disabled = this.sound.mute; slider.setAttribute('aria-valuetext', state.volumeDescription) }
      const output = document.querySelector('#volume-value')
      if (output) output.value = state.volumeText
    }

    toggleAudioMute() {
      this.sound.mute = !this.sound.mute
      accessibility.muted = this.sound.mute
      saveAccessibility()
      this.syncFallbackAudioVolume()
      this.updateAudioStatus()
    }

    updateShakeIndicator() {
      const indicator = document.querySelector('#camera-shake-status')
      if (indicator) indicator.textContent = accessibility.reducedMotion ? 'TEMBLOR BLOQUEADO' : `TEMBLOR ${this.screenShakeEnabled ? 'ON' : 'OFF'}`
    }

    toggleScreenShake() {
      if (accessibility.reducedMotion) { showControlNotice('Temblor bloqueado por Reducir movimiento'); return }
      this.screenShakeEnabled = !this.screenShakeEnabled
      try { localStorage.setItem('tramas-screen-shake', String(this.screenShakeEnabled)) } catch {}
      this.updateShakeIndicator()
      showControlNotice(`Temblor ${this.screenShakeEnabled ? 'activado' : 'desactivado'} · V para cambiar`)
    }

    setReducedMotion(enabled) {
      this.reducedMotion = Boolean(enabled)
      if (this.reducedMotion) {
        this.cameras?.main?.resetFX?.()
        if (this.cameras?.main) this.cameras.main.setZoom(1)
        this.tweens?.killTweensOf?.([this.cameras?.main, this.titlePrompt, this.actorGlow, this.damageFrame, this.damageVignette, ...(this.blocks || []).flatMap((block) => [block.container, block.label, ...(block.bits || [])]), ...(this.shots || []).map((shot) => shot.aura)].filter(Boolean))
        this.damageFrame?.setAlpha(0)
        this.damageVignette?.setAlpha(0)
        this.actor?.setAlpha(1)
        for (const block of this.blocks || []) { block.container?.setAlpha(1); block.bits?.forEach((bit) => bit.setAlpha(1)); block.impactFlashMs = 0; if (block.glowFx) block.glowFx.outerStrength = 1.4 }
        for (const shot of this.shots || []) shot.aura?.setAlpha(1)
        for (const particle of this.activeParticles || []) { this.activeParticles.delete(particle); particle.setActive(false).setVisible(false).setAlpha(1).setScale(1); this.particlePool?.release(particle) }
        for (const bit of this.activeBitParticles || []) { this.activeBitParticles.delete(bit); bit.setActive(false).setVisible(false).setAlpha(1).setRotation(0).setScale(1); this.bitParticlePool?.release(bit) }
      }
      this.updateShakeIndicator?.()
    }

    resumeAudio() {
      const context = this.sound.context
      const resumeGame = context?.state === 'suspended' ? context.resume().catch(() => {}) : Promise.resolve()
      if (this.bgmFallbackRequested && !this.audioContextFallback) this.ensureFallbackAudio()
      const fallback = this.audioContextFallback?.state === 'suspended' ? this.audioContextFallback.resume().catch(() => {}) : Promise.resolve()
      Promise.all([resumeGame, fallback]).then(() => {
        this.syncFallbackAudioVolume()
        if (this.bgmFallbackRequested && this.audioContextFallback?.state === 'running') this.startFallbackMusic()
      })
    }

    syncFallbackAudioVolume() {
      if (!this.audioFallbackMaster || !this.audioContextFallback) return
      const target = this.sound.mute ? 0 : accessibility.volume / 100
      this.audioFallbackMaster.gain.setTargetAtTime(target, this.audioContextFallback.currentTime, 0.025)
    }

    ensureFallbackAudio() {
      if (this.audioContextFallback) return this.audioContextFallback
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) return null
      try {
        this.audioContextFallback = this.sound.context ?? new AudioContextClass()
        this.audioFallbackMaster = this.audioContextFallback.createGain()
        this.audioFallbackMaster.gain.value = this.sound.mute ? 0 : accessibility.volume / 100
        this.audioFallbackMaster.connect(this.audioContextFallback.destination)
        return this.audioContextFallback
      } catch (error) {
        console.warn('Web Audio API no está disponible para los sonidos de respaldo.', error)
        return null
      }
    }

    playAudio(key, config = {}) {
      const exists = !this.missingAudio?.has(key) && this.cache.audio.exists(key)
      if (exists) return this.sound.play(key, config)
      const context = this.ensureFallbackAudio()
      if (!context || key === 'bgm') return null
      if (context.state === 'suspended') context.resume().catch(() => {})
      return this.playFallbackEffect(key, config, context)
    }

    playFallbackTone(context, { frequency, endFrequency = frequency, duration = 0.12, type = 'square', volume = 0.16, delay = 0, detune = 0, cutoff = 1800 }) {
      const startAt = context.currentTime + delay
      const oscillator = context.createOscillator()
      const envelope = context.createGain()
      const filter = context.createBiquadFilter()
      oscillator.type = type
      oscillator.frequency.setValueAtTime(Math.max(20, frequency), startAt)
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), startAt + duration)
      oscillator.detune.setValueAtTime(detune, startAt)
      filter.type = 'lowpass'; filter.frequency.setValueAtTime(cutoff, startAt); filter.Q.value = 0.8
      envelope.gain.setValueAtTime(0.0001, startAt)
      envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), startAt + Math.min(0.006, duration * 0.12))
      envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.24), startAt + duration * 0.32)
      envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
      oscillator.connect(filter); filter.connect(envelope); envelope.connect(this.audioFallbackMaster)
      oscillator.start(startAt); oscillator.stop(startAt + duration + 0.012)
      return oscillator
    }

    playFallbackEffect(key, config, context) {
      const detune = Number(config.detune) || 0
      const tone = (settings) => this.playFallbackTone(context, { ...settings, detune: (settings.detune || 0) + detune })
      switch (key) {
        case 'disparo':
          tone({ frequency: 880, endFrequency: 125, duration: 0.105, type: 'square', volume: 0.2, cutoff: 2600 })
          tone({ frequency: 185, endFrequency: 62, duration: 0.12, type: 'triangle', volume: 0.12, delay: 0.004, cutoff: 900 })
          break
        case 'impacto':
          tone({ frequency: 148, endFrequency: 43, duration: 0.19, type: 'sawtooth', volume: 0.23, cutoff: 950 })
          tone({ frequency: 296, endFrequency: 74, duration: 0.13, type: 'square', volume: 0.11, delay: 0.006, cutoff: 1400 })
          break
        case 'error':
          tone({ frequency: 196, endFrequency: 118, duration: 0.095, type: 'square', volume: 0.18, cutoff: 1300 })
          tone({ frequency: 124, endFrequency: 78, duration: 0.15, type: 'square', volume: 0.2, delay: 0.09, cutoff: 1050 })
          break
        case 'correccion':
          tone({ frequency: 620, endFrequency: 930, duration: 0.13, type: 'square', volume: 0.12 })
          tone({ frequency: 930, endFrequency: 1240, duration: 0.17, type: 'triangle', volume: 0.13, delay: 0.105 })
          break
        case 'rebote':
          tone({ frequency: 430, endFrequency: 720, duration: 0.075, type: 'square', volume: 0.11 })
          break
        case 'jefe':
          tone({ frequency: 92, endFrequency: 37, duration: 0.4, type: 'sawtooth', volume: 0.2, cutoff: 700 })
          tone({ frequency: 184, endFrequency: 55, duration: 0.32, type: 'square', volume: 0.09, delay: 0.02, cutoff: 900 })
          break
        case 'derrota':
          tone({ frequency: 220, endFrequency: 55, duration: 0.5, type: 'triangle', volume: 0.17 })
          break
        case 'victoria':
        case 'mejora':
          tone({ frequency: key === 'victoria' ? 523 : 587, endFrequency: key === 'victoria' ? 1046 : 1174, duration: 0.24, type: 'square', volume: 0.11 })
          tone({ frequency: key === 'victoria' ? 784 : 880, endFrequency: key === 'victoria' ? 1318 : 1396, duration: 0.28, type: 'triangle', volume: 0.12, delay: 0.12 })
          break
        default:
          tone({ frequency: 300, endFrequency: 180, duration: 0.14, type: 'square', volume: 0.14 })
      }
    }

    startBackgroundMusic() {
      if (this.musicStarted) return
      if (!this.missingAudio?.has('bgm') && this.cache.audio.exists('bgm')) {
        this.bgmSound = this.sound.add('bgm', { loop: true, volume: 0.3 })
        this.bgmSound.play()
      } else {
        this.bgmFallbackRequested = true
        this.startFallbackMusic()
      }
      this.musicStarted = true
      this.updateMusicForWave()
    }

    startFallbackMusic() {
      const context = this.ensureFallbackAudio()
      if (!context || this.fallbackBgmOscillators.length || context.state !== 'running') return
      for (const [frequency, volume] of [[110, 0.035], [164.81, 0.022], [220, 0.012]]) {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.type = 'sine'; oscillator.frequency.value = frequency
        gain.gain.value = volume
        oscillator.connect(gain); gain.connect(this.audioFallbackMaster); oscillator.start()
        this.fallbackBgmOscillators.push({ oscillator, baseFrequency: frequency })
      }
      this.fallbackMusicNextAt = context.currentTime + 0.04
      const notes = [110, 164.81, 220, 164.81, 130.81, 196, 261.63, 196]
      this.fallbackMusicTimer = setInterval(() => {
        if (context.state !== 'running') return
        const now = context.currentTime
        if (now - this.fallbackMusicNextAt > 0.4) this.fallbackMusicNextAt = now + 0.02
        const stepDuration = 0.22 / this.musicRate
        while (this.fallbackMusicNextAt < now + 0.08) {
          const step = this.fallbackMusicStep++ % notes.length
          const root = notes[step]
          this.playFallbackTone(context, { frequency: root * (step % 4 === 0 ? 0.5 : 1), endFrequency: root * 0.98, duration: stepDuration * 0.68, type: 'square', volume: step % 4 === 0 ? 0.075 : 0.035, cutoff: step % 4 === 0 ? 620 : 1500, delay: Math.max(0, this.fallbackMusicNextAt - now) })
          if (step % 2 === 1) this.playFallbackTone(context, { frequency: root * 2, endFrequency: root * 1.7, duration: stepDuration * 0.28, type: 'square', volume: 0.018, cutoff: 2200, delay: Math.max(0, this.fallbackMusicNextAt - now) })
          this.fallbackMusicNextAt += stepDuration
        }
      }, 24)
      this.syncFallbackAudioVolume()
    }

    updateMusicForWave() {
      const waveRate = 1 + Math.max(0, this.wave - 1) * 0.025
      this.musicRate = Math.min(1.16, waveRate * (this.congested ? 1.07 : 1))
      if (this.bgmSound?.setRate) this.bgmSound.setRate(this.musicRate)
      else if (this.audioContextFallback) this.fallbackBgmOscillators.forEach(({ oscillator, baseFrequency }) => { oscillator.frequency.setTargetAtTime(baseFrequency * this.musicRate, this.audioContextFallback.currentTime, 0.35) })
    }

    drawBackground() {
      const base = this.add.graphics().setDepth(-10)
      base.fillGradientStyle(COLORS.bg, COLORS.bg, 0x101d2c, 0x101d2c, 1); base.fillRect(0, 0, W, H)
      this.farGrid = this.add.graphics().setDepth(-9).setAlpha(0.55)
      this.farGrid.lineStyle(1, 0x143044, 0.5)
      for (let x = 0; x <= W; x += 48) this.farGrid.lineBetween(x, 0, x, H)
      for (let y = 0; y <= H; y += 48) this.farGrid.lineBetween(0, y, W, y)
      this.optionalBackgrounds = ['sprite-far', 'sprite-parallax', 'sprite-near'].filter((key) => this.textures.exists(key))
      this.optionalBackgrounds.forEach((key, index) => this.add.image(W / 2, H / 2, key, 0).setDisplaySize(W, H).setAlpha([0.12, 0.16, 0.1][index]).setDepth(-9.5 + index * 0.1))
      this.circuitLayer = this.add.container(0, 0).setDepth(-8)
      const traces = this.add.graphics()
      traces.lineStyle(2, COLORS.cyan, 0.13)
      const lanes = [112, 224, 336, 448]
      lanes.forEach((y, index) => {
        traces.lineBetween(0, y, W, y)
        for (const x of [110 + index * 31, 310 + index * 27, 610 - index * 19, 820 - index * 17]) {
          traces.lineBetween(x, y, x, y + (index % 2 ? 22 : -22))
          traces.lineBetween(x, y + (index % 2 ? 22 : -22), x + 34, y + (index % 2 ? 22 : -22))
          traces.fillStyle(COLORS.blue, 0.24); traces.fillCircle(x, y, 3)
        }
      })
      this.circuitLayer.add(traces)
      this.dataFlows = Array.from({ length: 18 }, (_, index) => {
        const lane = index % lanes.length
        const size = index % 4 === 0 ? 3 : 2
        const particle = this.add.rectangle(Math.random() * W, lanes[lane], size * 2, size, index % 3 ? COLORS.cyan : COLORS.blue, 0.72).setDepth(-7)
        return { object: particle, lane, speed: 32 + Math.random() * 46, offset: Math.random() * W }
      })
      this.flowLanes = lanes
      this.stars = Array.from({ length: 52 }, () => this.add.circle(Math.random() * W, Math.random() * H, Math.random() * 1.7 + 0.5, COLORS.cyan, Math.random() * 0.38 + 0.08).setDepth(-2))
      this.transitionOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x02070c, 1).setDepth(100).setAlpha(0)
      this.add.rectangle(W / 2, H - 20, W, 40, 0x091725, 0.95)
      this.add.rectangle(W / 2, H - 40, W, 1, COLORS.cyan, 0.25)
      this.damageFrame = this.add.graphics().setDepth(20).setAlpha(0)
      this.damageFrame.lineStyle(11, COLORS.red, 0.95); this.damageFrame.strokeRect(7, 7, W - 14, H - 14)
      this.damageFrame.lineStyle(28, COLORS.red, 0.22); this.damageFrame.strokeRect(1, 1, W - 2, H - 2)
      this.damageVignette = this.add.graphics().setDepth(19).setAlpha(0)
      this.damageVignette.fillStyle(COLORS.red, 0.18)
      this.damageVignette.fillRect(0, 0, W, 30); this.damageVignette.fillRect(0, H - 30, W, 30)
      this.damageVignette.fillRect(0, 0, 30, H); this.damageVignette.fillRect(W - 30, 0, 30, H)
    }

    createOptionalAnimations() {
      const sheets = [
        ['node-idle', 'sprite-node', 0, 3, 5],
        ['healthy-frame', 'sprite-healthy', 0, 3, 6],
        ['corrupt-frame', 'sprite-corrupt', 0, 3, 8],
        ['boss-frame', 'sprite-boss', 0, 3, 6],
      ]
      for (const [key, texture, start, end, frameRate] of sheets) {
        if (this.textures.exists(texture) && !this.anims.exists(key)) {
          this.anims.create({ key, frames: this.anims.generateFrameNumbers(texture, { start, end }), frameRate, repeat: -1 })
        }
      }
    }

    drawDashedBorder(graphics, x, y, width, height, dash = 8, gap = 5) {
      const horizontal = Math.ceil(width / (dash + gap))
      const vertical = Math.ceil(height / (dash + gap))
      graphics.lineStyle(2, COLORS.red, 0.95)
      for (let i = 0; i < horizontal; i++) {
        const start = x + i * (dash + gap)
        graphics.lineBetween(start, y, Math.min(start + dash, x + width), y)
        graphics.lineBetween(start, y + height, Math.min(start + dash, x + width), y + height)
      }
      for (let i = 0; i < vertical; i++) {
        const start = y + i * (dash + gap)
        graphics.lineBetween(x, start, x, Math.min(start + dash, y + height))
        graphics.lineBetween(x + width, start, x + width, Math.min(start + dash, y + height))
      }
    }

    text(x, y, value, size = 16, color = '#eaf8ff', options = {}) {
      const { originX, originY, ...style } = options
      const text = this.add.text(x, y, value, { fontFamily: 'IBM Plex Mono, Consolas, monospace', fontSize: `${size * accessibility.textSize / 100}px`, color, ...style })
      if (originX !== undefined || originY !== undefined) text.setOrigin(originX ?? 0, originY ?? 0)
      return text
    }

    fadeTransition(action) {
      if (this.transitioning) return
      this.transitioning = true
      this.transitionOverlay.setAlpha(0)
      this.tweens.add({ targets: this.transitionOverlay, alpha: 0.96, duration: 150, ease: 'Quad.In', onComplete: () => {
        action()
        this.tweens.add({ targets: this.transitionOverlay, alpha: 0, duration: 150, ease: 'Quad.Out', onComplete: () => { this.transitioning = false } })
      } })
    }

    renderTitle() {
      this.mode = 'title'
      this.titleShade = this.add.rectangle(W / 2, H / 2, W, H, 0x06111e, 0.62)
      this.titleTop = this.text(W / 2, 150, 'SIMULADOR DE INTEGRIDAD // 001', 13, '#18e6e1', { originX: 0.5, letterSpacing: 3 })
      this.titleMain = this.text(W / 2, 205, 'TRAMAS Y BLOQUES', 43, '#eaf8ff', { originX: 0.5, fontStyle: 'bold', letterSpacing: 3 })
      this.titleSub = this.text(W / 2, 263, 'EL RUIDO ESTÁ EN LA LÍNEA. ¿PUEDES DETECTARLO?', 13, '#8da6b9', { originX: 0.5, letterSpacing: 1 })
      this.titlePrompt = this.text(W / 2, 352, 'CONFIGURA TU LOADOUT PARA INICIAR', 15, '#18e6e1', { originX: 0.5 })
      this.titleHelp = this.text(W / 2, 390, '5 oleadas · 5 vidas · usa cámara o teclado', 12, '#8da6b9', { originX: 0.5 })
      if (!this.reducedMotion) this.tweens.add({ targets: this.titlePrompt, alpha: 0.25, duration: 720, yoyo: true, repeat: -1 })
    }

    clearTitle() {
      ;['titleShade', 'titleTop', 'titleMain', 'titleSub', 'titlePrompt', 'titleHelp'].forEach((key) => { this[key]?.destroy(); this[key] = null })
    }

    startRun() {
      if (this.transitioning) return
      if (this.mode === 'results') {
        this.fadeTransition(() => {
          this.clearResults()
          this.renderTitle()
          mainMenu.hidden = false
          loadoutPanel.classList.add('is-hidden')
        })
        return
      }
      if (this.mode !== 'title') return
      if (!loadoutSelection.balls.length) return
      this.fadeTransition(() => this.beginRun())
    }

    beginRun() {
      mainMenu.hidden = true
      document.querySelector('.shell').classList.add('in-run')
      loadoutPanel.classList.add('is-hidden')
      upgradePanel.hidden = true
      upgradePanel.innerHTML = ''
      this.clearResults()
      this.clearTitle()
      this.poseTracking = false
      this.actor?.destroy(); this.hud?.destroy(); this.bufferText?.destroy(); this.aimGraphics?.destroy(); this.bossHud?.destroy(); this.bossAttackGraphics?.destroy()
      this.blocks?.forEach((block) => block.container.destroy())
      this.shots?.forEach((shot) => { shot.dot?.destroy(); shot.aura?.destroy(); shot.sprite?.destroy() })
      this.toast?.destroy()
      this.difficulty = BALANCE.difficulty[loadoutSelection.difficulty] ?? BALANCE.difficulty.normal
      this.wave = 1; this.lives = this.difficulty.lives; this.score = 0; this.detected = 0; this.corrected = 0; this.lost = 0
      this.lifeLossCounts = { healthy: 0, corrupt: 0, boss: 0 }; this.lastLifeLossCause = null; this.defeatReason = ''
      this.runStartedAt = performance.now()
      this.ledger = createRunLedger(); this.metrics = this.ledger.totals; this.waveMetrics = this.ledger.waves
      this.combo = 0; this.congested = false; this.hitStopMs = 0
      this.invulnMs = 0; this.slowMotionMs = 0
      this.upgrades = { rapid: 0, multi: 0, shield: 0, pierce: 0, hammingArea: 0, bigBall: 0, slowBlocks: 0, scoreMagnet: 0, extraLife: 0 }; this.upgrades[loadoutSelection.perk] = 1
      this.shotHeat = 0
      this.equippedBalls = [...loadoutSelection.balls]
      this.selectedBall = this.equippedBalls[0]
      document.querySelector('#method-summary-status').textContent = ({ parity: 'PARIDAD', crc: 'CRC', hamming: 'HAMMING' })[this.selectedBall] || this.selectedBall.toUpperCase()
      this.blocks = []; this.shots = []; this.boss = null
      this.player = { x: W / 2, y: H - 72, radius: 18, velocityX: 0 }
      this.actor = this.add.container(this.player.x, this.player.y)
      const glow = this.add.circle(0, 0, 48, COLORS.cyan, 0.2)
      const baseRing = this.add.circle(0, 3, 31, 0x0c2635, 0.98).setStrokeStyle(3, COLORS.cyan, 0.9)
      const barrel = this.add.rectangle(0, -29, 13, 42, 0x164454, 1).setStrokeStyle(2, COLORS.cyan, 0.95)
      const turret = this.add.polygon(0, 1, [0, -24, 21, -13, 25, 8, 0, 23, -25, 8, -21, -13], 0x123048, 1).setStrokeStyle(3, COLORS.cyan, 1)
      const core = this.add.circle(0, 2, 9, COLORS.cyan, 1).setStrokeStyle(2, 0xeaffff, 1)
      const base = this.add.rectangle(0, 32, 88, 9, COLORS.cyan, 0.95)
      const optionalNode = this.textures.exists('sprite-node') ? this.add.sprite(0, 0, 'sprite-node').setDisplaySize(58, 58).setAlpha(0.3).play('node-idle') : null
      this.actor.add([glow, baseRing, base, barrel, turret, core])
      if (optionalNode) this.actor.addAt(optionalNode, 1)
      this.actorGlow = glow
      if (!this.reducedMotion) this.tweens.add({ targets: glow, alpha: 0.22, scale: 1.14, duration: 950, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
      this.aimGraphics = this.add.graphics()
      this.aimGraphics.setDepth(8)
      this.hud = this.add.container(0, 0).setDepth(30)
      this.hud.add(this.add.rectangle(W / 2, 38, W, 76, 0x06111e, 0.94).setStrokeStyle(1, COLORS.cyan, 0.24))
      this.hud.add([this.text(24, 17, 'OLEADA', 11, '#78909f'), this.text(24, 34, '', 19, '#18e6e1', { fontStyle: 'bold' })]); this.waveText = this.hud.list[1]
      this.hud.add([this.text(172, 17, 'VIDAS', 11, '#78909f'), this.text(172, 37, '', 15, '#ff416d')]); this.lifeText = this.hud.list[3]
      this.hud.add([this.text(306, 17, 'TRAMAS DETECTADAS', 11, '#78909f'), this.text(306, 37, '', 15, '#eaf8ff')]); this.detectText = this.hud.list[5]
      this.hud.add([this.text(510, 17, 'CORREGIDAS', 11, '#78909f'), this.text(510, 37, '', 15, '#ffcb57')]); this.fixedText = this.hud.list[7]
      this.hud.add([this.text(702, 17, 'PUNTOS', 11, '#78909f'), this.text(702, 37, '', 15, '#eaf8ff')]); this.scoreText = this.hud.list[9]
      this.hud.add([this.text(812, 17, 'RÁFAGA', 10, '#78909f'), this.text(812, 34, '0', 20, '#6bff9f')]); this.comboText = this.hud.list[11]
      this.bufferText = this.text(24, 59, 'BUFFER 0 / 5', 9, '#78909f')
      this.cooldownBg = this.add.rectangle(704, 61, 138, 5, 0x263b4b, 1).setOrigin(0, 0.5)
      this.cooldownBar = this.add.rectangle(704, 61, 138, 5, TYPE[this.selectedBall].color, 1).setOrigin(0, 0.5)
      this.cooldownLabel = this.text(704, 49, 'RECARGA', 7, '#78909f')
      this.reticleHeatBg = this.add.rectangle(W / 2, H - 128, 88, 9, 0x101b29, 0.98).setStrokeStyle(1, 0x8ba5b7, 0.7).setVisible(false)
      this.reticleHeatBar = this.add.rectangle(W / 2 - 41, H - 128, 82, 5, TYPE[this.selectedBall].color, 1).setOrigin(0, 0.5).setVisible(false)
      this.reticleHeatLabel = this.text(W / 2, H - 141, '', 8, '#ff6c87', { originX: 0.5, fontStyle: 'bold' }).setVisible(false)
      this.comboBg = this.add.rectangle(810, 65, 128, 5, 0x263b4b, 1).setOrigin(0, 0.5)
      this.comboBar = this.add.rectangle(810, 65, 0, 5, COLORS.green, 1).setOrigin(0, 0.5)
      this.hud.add([this.bufferText, this.cooldownLabel, this.cooldownBg, this.cooldownBar, this.comboBg, this.comboBar, this.reticleHeatBg, this.reticleHeatBar, this.reticleHeatLabel])
      this.hud.add([this.text(948, 18, 'ESC PAUSA', 10, '#78909f', { originX: 1 })])
      this.hud.setScrollFactor(0)
      this.bossHud = this.add.container(0, 0).setDepth(29).setVisible(false)
      const bossTitle = this.text(W / 2, 80, 'TRAMA MASIVA', 10, '#ff8ba5', { originX: 0.5, letterSpacing: 2 })
      const bossBarBg = this.add.rectangle(W / 2, 98, 360, 12, 0x40192b, 0.95)
      this.bossBar = this.add.rectangle(W / 2 - 178, 98, 356, 8, COLORS.red, 1).setOrigin(0, 0.5)
      this.bossPhaseText = this.text(W / 2, 111, 'FASE 1', 8, '#ffb4c5', { originX: 0.5 })
      this.bossWarning = this.text(W / 2, 135, '', 12, '#ff416d', { originX: 0.5, fontStyle: 'bold' }).setVisible(false)
      this.bossHud.add([bossTitle, bossBarBg, this.bossBar, this.bossPhaseText, this.bossWarning])
      this.bossAttackGraphics = this.add.graphics().setDepth(6)
      this.mode = 'playing'
      this.wave = 1
      if (!readTutorialSeen(localStorage)) this.startTutorial({ startsWave: true })
      else this.beginWave()
    }

    startTutorial({ startsWave = false, returnTo = null } = {}) { tutorialStep = 0; this.tutorialStartsWave = startsWave; this.tutorialReturnTo = returnTo; tutorialMessage.textContent = tutorialSteps[tutorialStep]; document.querySelector('#tutorial-next').textContent = 'SIGUIENTE'; tutorialPanel.hidden = false; this.mode = 'tutorial'; focusPanel(tutorialPanel, '#tutorial-next') }
    openTutorialPreview(returnTo = 'menu') {
      if (this.mode === 'playing') this.pause()
      if (returnTo === 'menu') mainMenu.hidden = true
      if (returnTo === 'options') { mainMenu.hidden = true; document.querySelector('.accessibility-panel').open = false }
      if (returnTo === 'pause-options') pausePanel.hidden = true
      this.startTutorial({ startsWave: false, returnTo })
    }
    advanceTutorial() { if (this.mode !== 'tutorial') return; tutorialStep++; if (tutorialStep >= tutorialSteps.length) this.finishTutorial(); else tutorialMessage.textContent = tutorialSteps[tutorialStep]; document.querySelector('#tutorial-next').textContent = tutorialStep === tutorialSteps.length - 1 ? 'EMPEZAR' : 'SIGUIENTE'; focusPanel(tutorialPanel, '#tutorial-next') }
    finishTutorial(action = 'complete') {
      if (this.mode !== 'tutorial') return
      completeTutorial(localStorage, action)
      tutorialPanel.hidden = true
      const startsWave = this.tutorialStartsWave
      const returnTo = this.tutorialReturnTo
      this.tutorialStartsWave = false; this.tutorialReturnTo = null
      if (startsWave) { this.mode = 'playing'; this.beginWave(); focusGameCanvas(); return }
      if (returnTo === 'menu') { this.mode = 'title'; mainMenu.hidden = false; focusPanel(mainMenu, '[data-menu-action="play"]') }
      else if (returnTo === 'pause-options') { this.mode = 'paused'; pausePanel.hidden = false; focusPanel(pausePanel, '[data-pause-action="resume"]') }
      else { this.mode = 'title'; mainMenu.hidden = false; document.querySelector('.accessibility-panel').open = true; focusPanel(document.querySelector('.accessibility-panel'), '#setting-smoothing') }
    }

    beginWave() {
      this.ledger.beginWave(this.wave)
      this.updateMusicForWave()
      const waveConfig = BALANCE.waves[this.wave]
      this.waveTotal = waveConfig.count
      this.spawned = 0
      this.spawnTimer = 0.5
      this.boss = null
      if (this.wave === 5) this.spawnBoss()
      this.updateHud()
      this.showToast(this.wave === 5 ? 'ALERTA: TRAMA MASIVA' : `OLEADA ${String(this.wave).padStart(2, '0')} // INICIADA`)
    }

    recordMetric(key, amount = 1) {
      if (key === 'detected') amount = Math.min(amount, Math.max(0, this.metrics.corruptCreated - this.metrics.detected))
      if (!amount) return
      this.ledger.record(key, this.wave, amount)
      if (key === 'detected' || key === 'corrected' || key === 'lost') this[key] = this.metrics[key]
    }

    markProcessed(block) {
      this.ledger.settle(block, this.wave)
    }

    showToast(label) {
      this.toast?.destroy()
      this.toast = this.text(W / 2, 128, label, 16, '#18e6e1', { originX: 0.5, fontStyle: 'bold', letterSpacing: 2 }).setDepth(31)
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
      this.cooldownBar?.setDisplaySize(138 * (1 - Math.min(1, this.fireCooldown / (this.fireCooldownMax || 0.34))), 5)
      this.updateHeatIndicator(this.game.loop.time)
      this.comboBar?.setDisplaySize(128 * Math.min(1, this.combo / 12), 5)
      this.bossHud?.setVisible(Boolean(this.boss?.alive))
      if (this.boss?.alive) {
        this.bossBar.setDisplaySize(356 * Math.max(0, this.boss.hp / this.boss.maxHp), 8)
        this.bossPhaseText.setText(`FASE ${this.boss.phase} · ${this.boss.hp}/${this.boss.maxHp}`)
      }
    }

    updateHeatIndicator(time = 0) {
      const hot = this.shotHeat > 0.65
      const overheated = this.shotHeat >= 0.98
      const blink = overheated && !this.reducedMotion ? 0.3 + (0.7 * (0.5 + 0.5 * Math.sin(time * 0.025))) : 1
      const localHeat = Math.max(this.shotHeat, 0.55 * Math.min(1, this.fireCooldown / (this.fireCooldownMax || 0.34)))
      const visible = this.shotHeat > 0.42 || this.fireCooldown > 0.18
      const x = this.player?.x ?? W / 2
      const y = (this.player?.y ?? H - 72) - 55
      this.cooldownBar?.setFillStyle(hot ? COLORS.red : TYPE[this.selectedBall].color).setAlpha(blink)
      this.cooldownLabel?.setText(hot ? `${overheated ? '¡' : ''}CALOR ${Math.round(this.shotHeat * 100)}%${overheated ? ' · TOPE' : ''}` : 'RECARGA').setColor(hot ? '#ff416d' : '#78909f').setAlpha(blink)
      this.reticleHeatBg?.setPosition(x, y).setVisible(visible).setAlpha(overheated ? blink : 1)
      this.reticleHeatBar?.setPosition(x - 41, y).setDisplaySize(82 * localHeat, 5).setFillStyle(hot ? COLORS.red : TYPE[this.selectedBall].color).setVisible(visible).setAlpha(blink)
      this.reticleHeatLabel?.setPosition(x, y - 14).setText(overheated ? `SOBRECALENTADO ${Math.round(this.shotHeat * 100)}%` : hot ? `CALOR ${Math.round(this.shotHeat * 100)}%` : 'RECARGA').setColor(hot ? '#ff416d' : '#a7bdcc').setVisible(visible).setAlpha(blink)
    }

    loseLife(playError = true, cause = 'corrupt') {
      if (this.invulnMs > 0) return false
      if (this.upgrades.shield > 0) {
        this.upgrades.shield--
        this.showToast('ESCUDO ACTIVADO · VIDA PROTEGIDA')
        this.updateHud()
        return false
      } else {
        this.lives--
        this.lifeLossCounts[cause] = (this.lifeLossCounts[cause] || 0) + 1
        this.lastLifeLossCause = cause
        this.invulnMs = BALANCE.player.invulnerabilityMs
        if (playError) this.playAudio('error')
      }
      if (this.lives <= 0) {
        if (cause === 'healthy') this.defeatReason = `Sin vidas: ${this.lifeLossCounts.healthy} impactos a tramas sanas.`
        else if (cause === 'boss') this.defeatReason = `Sin vidas: ${this.lifeLossCounts.boss} ataques del jefe.`
        else this.defeatReason = `Sin vidas: ${this.metrics?.lost || 0} corruptas llegaron al nodo.`
      }
      this.updateHud()
      return true
    }

    comboMultiplier() { return comboScoreMultiplier(this.combo) }

    recordCorruptKill() {
      this.combo++
      const multiplier = this.comboMultiplier()
      this.playAudio('impacto', { detune: Math.min(900, this.combo * 80) })
      if (this.comboText) this.tweens.add({ targets: this.comboText, scale: 1.5, duration: 80, yoyo: true, ease: 'Back.Out' })
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
      if (this.screenShakeEnabled && !this.reducedMotion) this.cameras.main.shake(180, 0.006)
      if (this.reducedMotion) { this.damageFrame.setAlpha(0); this.damageVignette.setAlpha(0); this.floatingText(this.player?.x ?? W / 2, (this.player?.y ?? H - 72) - 38, '−1 VIDA', '#ff416d'); return }
      this.tweens.killTweensOf(this.damageFrame)
      this.tweens.killTweensOf(this.damageVignette)
      this.damageFrame.setAlpha(0.95)
      this.tweens.add({ targets: this.damageFrame, alpha: 0, duration: 320, ease: 'Quad.Out' })
      this.damageVignette.setAlpha(1)
      this.tweens.add({ targets: this.damageVignette, alpha: 0, duration: 360, ease: 'Quad.Out' })
      if (this.actor) this.actor.setAlpha(0.25)
      this.floatingText(this.player?.x ?? W / 2, (this.player?.y ?? H - 72) - 38, '−1 VIDA', '#ff416d')
    }

    floatingText(x, y, label, color = '#eaf8ff') {
      const text = this.text(x, y, label, 13, color, { originX: 0.5, fontStyle: 'bold' }).setDepth(25)
      this.tweens.add({ targets: text, y: y - 38, alpha: 0, scale: 1.15, duration: 650, ease: 'Cubic.Out', onComplete: () => text.destroy() })
    }

    createBlockDisplay() {
      const container = this.add.container(0, 0)
      const borderGraphic = this.add.graphics(); container.add(borderGraphic)
      const bits = Array.from({ length: 8 }, () => { const bit = this.add.rectangle(0, 0, 8, 16, COLORS.cyan, 0.78); container.add(bit); return bit })
      const label = this.add.text(0, 0, '', { fontFamily: 'IBM Plex Mono, Consolas, monospace', color: '#78dedc', letterSpacing: 1 }).setOrigin(0.5); container.add(label)
      const sprite = this.textures.exists('sprite-healthy') ? this.add.sprite(0, 0, 'sprite-healthy').setAlpha(0.3).setVisible(false) : null
      if (sprite) container.addAt(sprite, 0)
      return { container, borderGraphic, bits, label, sprite, pooled: true }
    }

    createBlock(x, y, corrupted, boss = false, hp = 1) {
      const w = boss ? 188 : 102; const h = boss ? 82 : 53
      const optionalKey = boss ? 'sprite-boss' : corrupted ? 'sprite-corrupt' : 'sprite-healthy'
      const item = this.blockPool.acquire()
      if (!item) return null
      this.recordMetric('created')
      if (corrupted) this.recordMetric('corruptCreated')
      const { container, borderGraphic: gfx, bits, label, sprite } = item
      container.setPosition(x, y).setVisible(true).setAlpha(1).setScale(1)
      this.tweens.killTweensOf(container)
      bits.forEach((bit) => { this.tweens.killTweensOf(bit); bit.setVisible(true).setAlpha(1).setScale(1) })
      if (sprite) { this.tweens.killTweensOf(sprite); sprite.setVisible(false) }
      if (!item.glowFx && this.game.renderer.type === Phaser.WEBGL && gfx.postFX?.addGlow) {
        try { item.glowFx = gfx.postFX.addGlow(COLORS.cyan, 1.4, 0.6, false, 0.08, 8) } catch { item.glowFx = null }
      }
      if (item.glowFx) {
        item.glowFx.color = corrupted || boss ? COLORS.red : COLORS.cyan
        item.glowFx.outerStrength = boss ? 3.4 : corrupted ? 2.7 : 1.3
        item.glowFx.innerStrength = corrupted || boss ? 0.8 : 0.45
      }
      container.setPosition(x, y)
      if (sprite && this.textures.exists(optionalKey)) {
        sprite.setTexture(optionalKey).setDisplaySize(w * 0.88, h * 0.82).setAlpha(0.3).setVisible(true)
        const animation = boss ? 'boss-frame' : corrupted ? 'corrupt-frame' : 'healthy-frame'
        if (this.anims.exists(animation)) sprite.play(animation)
      }
      gfx.clear().fillStyle(boss ? 0x381b35 : (corrupted ? 0x301c32 : 0x102c39), 0.98).fillRoundedRect(-w / 2, -h / 2, w, h, 7)
      if (corrupted) this.drawDashedBorder(gfx, -w / 2, -h / 2, w, h)
      else gfx.lineStyle(2, COLORS.cyan, 0.95).strokeRoundedRect(-w / 2, -h / 2, w, h, 7)
      gfx.lineStyle(1, 0xffffff, 0.11).lineBetween(-w / 2 + 8, -h / 2 + 9, w / 2 - 8, -h / 2 + 9)
      const count = boss ? 8 : 8; const bitW = boss ? 15 : 8; const gap = boss ? 5 : 3
      const startX = -((count * bitW + (count - 1) * gap) / 2)
      const badBit = corrupted ? Phaser.Math.Between(0, count - 1) : -1
      for (let i = 0; i < count; i++) {
        const isBad = i === badBit
        const rect = bits[i].setPosition(startX + i * (bitW + gap) + bitW / 2, boss ? 5 : 2).setSize(bitW, boss ? 21 : 16).setFillStyle(isBad ? COLORS.red : (boss ? 0xff7891 : COLORS.cyan), isBad ? 1 : 0.78)
        if (isBad && !this.reducedMotion) this.tweens.add({ targets: rect, alpha: 0.22, duration: 320, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
      }
      const icon = corrupted ? '⚠' : '✓'
      const labelText = boss ? `${icon} TRAMA MASIVA · ${hp}` : (corrupted ? `${icon} ERROR DETECTADO` : `${icon} TRAMA ÍNTEGRA`)
      label.setPosition(0, -h / 2 + 15).setFontSize(boss ? '10px' : '8px').setColor(corrupted ? '#ff8ba5' : '#78dedc').setText(labelText)
      Object.assign(item, { x, y, w, h, corrupted, boss, hp, maxHp: hp, phase: 1, attackTimer: 2.8, warningMs: 0, phaseTransitionMs: 0, disruptedMs: 0, warningText: null, entering: false, alive: true, badBit, zigzag: false, hitError: false, markedProcessed: false, impactFlashMs: 0, seed: Math.random() * Math.PI * 2 })
      item.speed = (boss ? BALANCE.waves[5].speed : BALANCE.waves[this.wave].speed) * this.difficulty.speedMultiplier * Math.max(0.62, 1 - this.upgrades.slowBlocks * 0.08)
      this.blocks.push(item)
      if (boss) this.boss = item
      return item
    }

    updateBlockAppearance(block) {
      const gfx = block.borderGraphic
      gfx.clear()
      gfx.fillStyle(block.boss ? 0x193842 : 0x102c39, 0.98)
      gfx.fillRoundedRect(-block.w / 2, -block.h / 2, block.w, block.h, 7)
      gfx.lineStyle(2, COLORS.cyan, 0.98); gfx.strokeRoundedRect(-block.w / 2, -block.h / 2, block.w, block.h, 7)
      gfx.lineStyle(1, 0xffffff, 0.18); gfx.lineBetween(-block.w / 2 + 8, -block.h / 2 + 9, block.w / 2 - 8, -block.h / 2 + 9)
    }

    spawnBoss() {
      this.playAudio('jefe')
      const boss = this.createBlock(W / 2, -80, true, true, BALANCE.waves[5].bossHealth)
      if (!boss) return
      boss.entering = true
      boss.container.setScale(0.72)
      this.tweens.add({ targets: boss.container, y: 145, scale: 1, duration: 1050, ease: 'Back.Out', onComplete: () => { if (boss.alive) { boss.y = 145; boss.entering = false } } })
      this.bossHud?.setVisible(true)
      this.showToast('ENTRADA DE TRAMA MASIVA')
      this.spawned = 1
    }

    spawnBlock() {
      if (this.spawned >= this.waveTotal) return
      const waveConfig = BALANCE.waves[this.wave]
      const corrupted = Math.random() < waveConfig.corruptChance
      const block = this.createBlock(90 + Math.random() * (W - 180), -35, corrupted)
      if (!block) return
      block.zigzag = this.wave === 4 && Math.random() < 0.65
      block.originX = block.x
      block.zigzagPhase = Math.random() * Math.PI * 2
      this.spawned++
    }

    createProjectileVisual(x, y, type, radius) {
      const color = TYPE[type].color
      const visual = this.projectileVisualPool.acquire()
      if (!visual) return null
      const { shape, aura, sprite } = visual
      shape.clear().setPosition(x, y).setVisible(true).setAlpha(1).setScale(1)
      shape.fillStyle(color, 1); shape.lineStyle(1.5, 0xeaf8ff, 0.9)
      if (type === 'parity') { shape.fillCircle(0, 0, radius); shape.strokeCircle(0, 0, radius) }
      else {
        const sides = type === 'crc' ? 6 : 4
        shape.beginPath()
        for (let i = 0; i < sides; i++) {
          const angle = -Math.PI / 2 + i * Math.PI * 2 / sides
          const px = Math.cos(angle) * radius; const py = Math.sin(angle) * radius
          if (i === 0) shape.moveTo(px, py)
          else shape.lineTo(px, py)
        }
        shape.closePath(); shape.fillPath(); shape.strokePath()
      }
      aura.setPosition(x, y).setRadius(radius + (type === 'hamming' ? 9 : 5)).setFillStyle(color, type === 'hamming' ? 0.24 : type === 'crc' ? 0.18 : 0.11).setStrokeStyle(type === 'hamming' ? 2 : type === 'crc' ? 1.6 : 1, color, type === 'hamming' ? 0.95 : 0.75).setVisible(true).setAlpha(1).setScale(1)
      const glowStrength = type === 'hamming' ? 3.2 : type === 'crc' ? 2.6 : 1.25
      if (!aura.postGlowFx && this.game.renderer.type === Phaser.WEBGL && aura.postFX?.addGlow) { try { aura.postGlowFx = aura.postFX.addGlow(color, glowStrength, 0.65, false, 0.08, type === 'parity' ? 6 : 9) } catch {} }
      if (aura.postGlowFx) { aura.postGlowFx.color = color; aura.postGlowFx.outerStrength = glowStrength; aura.postGlowFx.innerStrength = type === 'hamming' ? 0.9 : 0.65 }
      if (type === 'hamming' && !this.reducedMotion) this.tweens.add({ targets: aura, scale: 1.22, alpha: 0.08, duration: 260, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
      const spriteFrame = { parity: 0, crc: 1, hamming: 2 }[type]
      if (sprite) sprite.setTexture('sprite-projectiles', spriteFrame).setPosition(x, y).setDisplaySize(radius * 4, radius * 4).setAlpha(0.32).setVisible(true)
      return visual
    }

    createProjectileVisualEntry() {
      const shape = this.add.graphics().setVisible(false)
      const aura = this.add.circle(0, 0, 8, 0xffffff, 0).setVisible(false)
      const sprite = this.textures.exists('sprite-projectiles') ? this.add.sprite(0, 0, 'sprite-projectiles', 0).setVisible(false) : null
      return { shape, aura, sprite }
    }

    acquireShot(x, y, vx, vy, type, radius) {
      const shot = this.shotPool.acquire()
      if (!shot) return null
      Object.assign(shot, { x, y, vx, vy, type, bounces: 0, pierces: 0, radius, alive: true, trailTimer: 0 })
      shot.hits.clear()
      const visual = this.createProjectileVisual(x, y, type, radius)
      if (!visual) { shot.alive = false; this.shotPool.release(shot); return null }
      shot.visual = visual
      shot.dot = visual.shape; shot.aura = visual.aura; shot.sprite = visual.sprite
      this.shots.push(shot)
      return shot
    }

    fire() {
      if (this.mode !== 'playing' || this.fireCooldown > 0) return
      if (this.shots.length >= this.maxShots) return
      this.playAudio('disparo')
      const spec = TYPE[this.selectedBall]
      const angle = this.aim
      const speed = this.selectedBall === 'crc' ? BALANCE.combat.crcShotSpeed : BALANCE.combat.shotSpeed
      const vx = Math.cos(angle) * speed; const vy = Math.sin(angle) * speed
      const shot = this.acquireShot(this.player.x, this.player.y - 18, vx, vy, this.selectedBall, (this.selectedBall === 'hamming' ? 8 : 6) + this.upgrades.bigBall * 2)
      if (!shot) return
      this.shotHeat = Math.min(1, this.shotHeat + BALANCE.combat.spamHeatPerShot)
      const baseCooldown = BALANCE.combat.shotCooldownSeconds - this.upgrades.rapid * BALANCE.combat.rapidReductionSeconds
      const heatPenalty = this.shotHeat > 0.65 ? (this.shotHeat - 0.65) * BALANCE.combat.maxHeatCooldownSeconds : 0
      this.fireCooldown = Math.max(BALANCE.combat.minShotCooldownSeconds, baseCooldown) + heatPenalty
      this.fireCooldownMax = this.fireCooldown
      this.recoil = 8
      this.emitParticle(this.player.x + Math.cos(angle) * 19, this.player.y - 18 + Math.sin(angle) * 19, spec.color, 10, 0, 0, 110)
      if (this.screenShakeEnabled && !this.reducedMotion) this.cameras.main.shake(45, 0.0015)
      if (this.upgrades.multi > 0 && this.shots.length < this.maxShots) {
        for (const offset of [-0.09, 0.09]) {
          if (this.shots.length >= this.maxShots) break
          this.acquireShot(this.player.x, this.player.y - 18, Math.cos(angle + offset) * speed, Math.sin(angle + offset) * speed, shot.type, shot.radius)
        }
      }
    }

    hitBlock(shot, block) {
      if (!block.alive || block.hitError || shot.hits.has(block)) return
      shot.hits.add(block)
      this.flashBlockImpact(block, shot.type === 'hamming' ? COLORS.green : TYPE[shot.type].color)
      if (shot.type === 'hamming') this.triggerHitStop(40)
      if (shot.type === 'hamming') {
        this.playAudio('correccion')
        if (block.corrupted) {
          block.corrupted = false; block.badBit = -1; this.updateBlockAppearance(block)
          block.container.list.forEach((child) => { if (child.type === 'Rectangle' && child.width < 20) { this.tweens.killTweensOf(child); child.setAlpha(1); child.setFillStyle(COLORS.green, 0.9) } })
          block.label.setText(block.boss ? `✓ REPARANDO · ${block.hp}` : '✓ ERROR CORREGIDO')
          block.label.setColor('#6bff9f'); this.recordMetric('corrected'); this.score += BALANCE.score.hammingCorrection; this.emitCorrectionEffect(block.x, block.y)
          this.floatingText(block.x, block.y - block.h / 2, 'CORREGIDO', '#6bff9f')
          block.bits.forEach((bit) => { if (bit.fillColor === COLORS.red || bit.fillColor === 0xff416d) { bit.setFillStyle(COLORS.green, 1); if (!this.reducedMotion) this.tweens.add({ targets: bit, alpha: 0.25, yoyo: true, repeat: 2, duration: 90 }) } })
          if (this.upgrades.hammingArea) {
            const radius = 105 + this.upgrades.hammingArea * 35
            this.showHammingRing(block.x, block.y, radius)
            for (const neighbor of this.blocks) {
              if (!neighbor.alive || neighbor === block || !neighbor.corrupted || Phaser.Math.Distance.Between(block.x, block.y, neighbor.x, neighbor.y) > radius) continue
              neighbor.corrupted = false; neighbor.badBit = -1; this.updateBlockAppearance(neighbor)
              neighbor.bits.forEach((bit) => { if (bit.fillColor === COLORS.red || bit.fillColor === 0xff416d) bit.setFillStyle(COLORS.green, 1) })
              neighbor.label.setText('✓ ERROR CORREGIDO'); neighbor.label.setColor('#6bff9f')
              this.recordMetric('corrected'); this.score += BALANCE.score.hammingCorrection; this.emitCorrectionEffect(neighbor.x, neighbor.y)
              this.floatingText(neighbor.x, neighbor.y - 20, 'CORREGIDO', '#6bff9f')
            }
          }
        } else { this.recordMetric('misfires'); this.markProcessed(block); this.playAudio('error'); this.breakCombo(); this.score = Math.max(0, this.score - BALANCE.score.hammingHealthyPenalty); this.emitBurst(block.x, block.y, COLORS.red); this.flashBlockError(block); this.floatingText(block.x, block.y - 25, 'TRAMA SANA · ERROR', '#ff416d') }
        this.destroyShot(shot)
      } else if (!block.corrupted && !block.boss) {
        this.recordMetric('misfires'); this.markProcessed(block); this.playAudio('error'); this.breakCombo(); const lifeLost = this.loseLife(false, 'healthy'); this.score = Math.max(0, this.score - BALANCE.score.healthyPenalty); this.emitBurst(block.x, block.y, COLORS.red); block.hitError = true; this.flashBlockError(block); this.floatingText(block.x, block.y - 25, 'TRAMA SANA · ERROR', '#ff416d'); if (lifeLost) this.triggerDamageFeedback(); this.time.delayedCall(360, () => { this.removeBlock(block); this.updateHud() }); this.destroyShot(shot); this.updateHud()
        if (this.lives <= 0) this.finishRun(false)
      } else if (block.boss) {
        block.hp -= BALANCE.combat.damage; block.label.setText(`TRAMA MASIVA · FASE ${block.phase}`); this.score += BALANCE.score.bossHit; this.emitBurst(block.x + Phaser.Math.Between(-35, 35), block.y + 10, TYPE[shot.type].color); this.floatingText(block.x, block.y - 38, `+${BALANCE.score.bossHit}`, '#ffb4c5'); this.updateBossPhase(block)
        if (block.hp <= 0) { if (block.corrupted) this.recordMetric('detected'); this.playAudio('impacto', { detune: Phaser.Math.Between(-60, 60) }); this.triggerHitStop(45); const multiplier = this.recordCorruptKill(); this.disintegrateBlock(block); this.removeBlock(block); this.score += Math.round(BALANCE.score.bossDefeat * multiplier); this.floatingText(block.x, block.y, `+${Math.round(BALANCE.score.bossDefeat * multiplier)}`, '#ffcb57'); this.showToast('JEFE DESACTIVADO') }
        if (shot.type === 'crc') this.bounceShot(shot); else this.destroyShot(shot)
      } else {
        this.playAudio('impacto', { detune: Phaser.Math.Between(-60, 60) })
        this.recordMetric('detected')
        const multiplier = this.recordCorruptKill()
        const basePoints = shot.type === 'crc' ? BALANCE.score.corruptCrc : BALANCE.score.corruptParity
        const points = Math.round(basePoints * multiplier * (1 + this.upgrades.scoreMagnet * 0.12))
        this.score += points; this.triggerHitStop(32); this.floatingText(block.x, block.y - 20, `+${points}`, '#6bff9f'); this.disintegrateBlock(block); this.removeBlock(block)
        if (this.screenShakeEnabled && !this.reducedMotion) this.cameras.main.shake(55, 0.0018)
        if (shot.type === 'crc' && this.upgrades.pierce > shot.pierces) { shot.pierces++; shot.hits.clear() }
        else if (shot.type === 'crc') this.bounceShot(shot)
        else this.destroyShot(shot)
      }
      this.updateHud()
    }

    removeBlock(block) {
      if (!block.alive) return
      this.markProcessed(block)
      block.alive = false
      this.tweens.killTweensOf(block.container)
      block.bits.forEach((bit) => this.tweens.killTweensOf(bit))
      block.container.setVisible(false)
      block.sprite?.anims?.pause?.()
      block.glowFx && (block.glowFx.outerStrength = 0)
      if (!this.blockPool.release(block)) console.warn('Trama fuera del pool detectada; se mantiene oculta para no crear/destruir gráficos en combate.')
      const index = this.blocks.indexOf(block)
      if (index >= 0) this.blocks.splice(index, 1)
      if (block === this.boss) { this.boss = null; this.bossHud?.setVisible(false); this.bossAttackGraphics?.clear() }
    }

    disintegrateBlock(block) {
      this.emitBinaryBits(block.x, block.y, block.corrupted ? '#ff617f' : '#18e6e1', block.boss ? 16 : 9)
      for (let i = 0; i < 12; i++) {
        this.emitParticle(block.x + Phaser.Math.Between(-block.w / 2, block.w / 2), block.y + Phaser.Math.Between(-block.h / 2, block.h / 2), i % 3 ? COLORS.cyan : COLORS.red, Phaser.Math.Between(3, 8), Phaser.Math.Between(-46, 46), Phaser.Math.Between(40, 100), Phaser.Math.Between(320, 620))
      }
    }

    flashBlockError(block) {
      if (this.reducedMotion) return
      block.container.setAlpha(0.25)
      this.tweens.add({ targets: block.container, alpha: 1, duration: 90, yoyo: true, repeat: 3 })
    }

    updateBossPhase(boss) {
      const ratio = boss.hp / boss.maxHp
      const phase = ratio <= 1 / 3 ? 3 : ratio <= 2 / 3 ? 2 : 1
      if (phase === boss.phase) return
      boss.phase = phase
      boss.attackTimer = Math.max(2.2, boss.attackTimer)
      boss.phaseTransitionMs = 1450
      boss.phaseFlashColor = phase === 3 ? 0xff244f : 0xff8a3d
      this.bossWarning?.setText(`⚠ CAMBIO DE FASE · ${phase} · PREPÁRATE`).setColor(phase === 3 ? '#ff416d' : '#ffad68').setVisible(true)
      if (!this.reducedMotion) {
        this.cameras.main.flash(420, 255, 30, 90, false)
        if (this.screenShakeEnabled) this.cameras.main.shake(240, 0.0035)
        this.triggerHitStop(55)
      }
      this.showToast(`JEFE · FASE ${phase} · PATRÓN ${phase === 2 ? 'DOBLE' : 'RÁPIDO'}`)
      this.floatingText(boss.x, boss.y - 58, `FASE ${phase}`, '#ff8ba5')
    }

    drawBossPhaseTransition(boss) {
      const graphics = this.bossAttackGraphics
      if (!graphics || !boss?.alive || boss.phaseTransitionMs <= 0) return
      const progress = 1 - boss.phaseTransitionMs / 1450
      graphics.clear()
      if (this.reducedMotion) {
        graphics.lineStyle(3, boss.phaseFlashColor ?? COLORS.red, 0.72).strokeCircle(boss.x, boss.y, 104)
        graphics.lineStyle(1, 0xffdce4, 0.55).strokeCircle(boss.x, boss.y, 78)
        return
      }
      const radius = 28 + progress * 210
      const alpha = Math.max(0.14, 0.82 * (1 - progress * 0.72))
      graphics.lineStyle(5, boss.phaseFlashColor ?? COLORS.red, alpha).strokeCircle(boss.x, boss.y, radius)
      graphics.lineStyle(2, 0xffdce4, alpha * 0.72).strokeCircle(boss.x, boss.y, radius * 0.72)
    }

    drawBossTelegraph(boss, time) {
      const graphics = this.bossAttackGraphics
      if (!graphics || !boss?.targetXs) return
      const pulse = this.reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(time * 0.018)
      graphics.clear()
      const halfWidth = boss.phase === 1 ? 48 : boss.phase === 2 ? 76 : 58
      for (const x of boss.targetXs) {
        graphics.fillStyle(0xff244f, 0.07 + pulse * 0.12).fillRect(x - halfWidth, 160, halfWidth * 2, H - 225)
        graphics.lineStyle(3, 0xff416d, 0.35 + pulse * 0.65).lineBetween(x, 160, x, H - 65)
        graphics.lineStyle(1, 0xffd8e0, 0.3 + pulse * 0.55).lineBetween(x - halfWidth + 6, H - 88, x + halfWidth - 6, H - 88)
        for (let y = 180; y < H - 100; y += 32) graphics.fillStyle(0xff8ba5, 0.1 + pulse * 0.2).fillRect(x - halfWidth + 4, y, 5, 2)
        if (boss.phase >= 2) {
          const progress = Phaser.Math.Clamp(1 - boss.warningMs / 980, 0, 1)
          for (let wave = 0; wave < 2; wave++) {
            const waveProgress = progress * 2 - wave
            if (waveProgress < 0 || waveProgress > 1) continue
            const radius = 22 + waveProgress * (boss.phase === 3 ? 164 : 138)
            const alpha = this.reducedMotion ? 0.52 : (1 - waveProgress * 0.7) * (0.42 + pulse * 0.35)
            graphics.lineStyle(boss.phase === 3 ? 3 : 2, boss.phase === 3 ? 0xff416d : 0xff9c58, alpha).strokeCircle(x, H - 76, radius)
            graphics.lineStyle(1, 0xffe6d4, alpha * 0.6).strokeCircle(x, H - 76, radius * 0.84)
          }
        }
      }
    }

    updateBoss(delta, dt) {
      const boss = this.boss
      if (!boss?.alive || boss.entering) return
      if (boss.phaseTransitionMs > 0) {
        boss.phaseTransitionMs = Math.max(0, boss.phaseTransitionMs - delta)
        this.bossWarning?.setText(`⚠ CAMBIO DE FASE · ${boss.phase} · PREPÁRATE`).setVisible(boss.phaseTransitionMs > 0)
        if (boss.warningMs <= 0) this.drawBossPhaseTransition(boss)
      } else if (boss.warningMs <= 0) this.bossAttackGraphics?.clear()
      if (boss.warningMs > 0) {
        boss.warningMs -= delta
        this.drawBossTelegraph(boss, this.game.loop.time)
        if (boss.warningText) boss.warningText.setVisible(boss.warningMs > 0)
        if (boss.warningMs <= 0) {
          const dangerXs = boss.targetXs ?? [boss.targetX ?? this.player.x]
          const dangerWidth = boss.phase === 1 ? 48 : boss.phase === 2 ? 76 : 58
          if (dangerXs.some((dangerX) => Math.abs(this.player.x - dangerX) < dangerWidth) && this.invulnMs <= 0) {
            const lifeLost = this.loseLife(true, 'boss')
            if (lifeLost) this.triggerDamageFeedback()
          }
          if (this.lives <= 0) { this.finishRun(false); return }
          this.bossAttackGraphics?.clear()
          boss.attackTimer = Math.max(1.1, 2.8 - boss.phase * 0.55)
        }
        return
      }
      boss.attackTimer -= dt
      if (boss.attackTimer <= 0) {
        this.playAudio('jefe')
        boss.targetX = boss.phase === 1 ? this.player.x : Phaser.Math.Clamp(this.player.x + (Math.random() - 0.5) * 220, 55, W - 55)
        boss.targetXs = boss.phase === 3 ? [boss.targetX - 75, boss.targetX + 75].map((x) => Phaser.Math.Clamp(x, 40, W - 40)) : [boss.targetX]
        boss.warningMs = 980
        this.bossWarning.setText(boss.phase === 1 ? '¡ATAQUE VERTICAL! MUÉVETE' : boss.phase === 2 ? '¡BARRIDO ADELANTADO! CAMBIA DE POSICIÓN' : '¡DOBLE BARRIDO! ESQUIVA AMBOS').setVisible(true)
        this.bossWarning.setX(boss.targetXs[0])
        this.bossWarning.setColor('#ff416d')
        this.drawBossTelegraph(boss, this.game.loop.time)
      }
    }

    destroyShot(shot) {
      if (!shot?.alive) return
      shot.alive = false
      this.tweens.killTweensOf(shot.aura)
      shot.dot.setVisible(false); shot.aura.setVisible(false); shot.sprite?.setVisible(false)
      shot.hits.clear()
      const visual = shot.visual
      visual.shape.clear().setAlpha(1).setScale(1)
      visual.aura.setAlpha(1).setScale(1)
      this.projectileVisualPool.release(visual)
      shot.visual = shot.dot = shot.aura = shot.sprite = null
      this.shotPool.release(shot)
      const index = this.shots.indexOf(shot)
      if (index >= 0) this.shots.splice(index, 1)
    }

    emitProjectileTrail(shot) {
      if (shot.type !== 'crc') return
      this.emitParticle(shot.x, shot.y, 0x68c9ff, 3, -shot.vx * 0.06, -shot.vy * 0.06, 260)
    }
    bounceShot(shot, axis = null) {
      shot.bounces++
      if (shot.bounces >= 3) { this.destroyShot(shot); return }
      this.playAudio('rebote')
      this.emitCrcDistortion(shot.x, shot.y)
      if (axis === 'x' || (!axis && Math.abs(shot.vx) > Math.abs(shot.vy))) shot.vx *= -1
      else shot.vy *= -1
      shot.hits.clear()
    }

    emitCrcDistortion(x, y) {
      const radius = 148
      for (const block of this.blocks) {
        if (!block.alive || Phaser.Math.Distance.Between(x, y, block.x, block.y) > radius) continue
        const newlyDisrupted = block.disruptedMs <= 0
        block.disruptedMs = Math.max(block.disruptedMs, 1450)
        if (newlyDisrupted) this.floatingText(block.x, block.y - 24, 'CRC · FLUJO INESTABLE', '#79ccff')
      }
      if (this.reducedMotion) return
      this.emitBinaryBits(x, y, '#79ccff', 6)
      for (let i = 0; i < 7; i++) this.emitParticle(x, y, 0x55baff, 2, Phaser.Math.Between(-45, 45), Phaser.Math.Between(-30, 20), 300)
      const pulse = this.distortionPulsePool.acquire()
      if (!pulse) return
      pulse.setPosition(x, y).setScale(1).setAlpha(1).setActive(true).setVisible(true)
      this.tweens.killTweensOf(pulse)
      this.tweens.add({ targets: pulse, scale: radius / 8, alpha: 0, duration: 420, ease: 'Cubic.Out', onComplete: () => { pulse.setActive(false).setVisible(false).setScale(1).setAlpha(1); this.distortionPulsePool.release(pulse) } })
    }

    emitBurst(x, y, color) {
      for (let i = 0; i < 12; i++) {
        this.emitParticle(x, y, i % 4 === 0 ? COLORS.cyan : color, Phaser.Math.Between(2, 4), Phaser.Math.Between(-40, 40), Phaser.Math.Between(-34, 24), Phaser.Math.Between(300, 520))
      }
    }

    emitParticle(x, y, color, radius, dx, dy, duration) {
      if (this.reducedMotion) return
      const particle = this.particlePool.acquire()
      if (!particle) return
      particle.setActive(true).setPosition(x, y).setRadius(radius).setFillStyle(color, 0.95).setAlpha(0.95).setScale(1).setVisible(true)
      Object.assign(particle, { vx: dx * 2.2, vy: dy * 2.2, gravity: 220, age: 0, life: duration })
      this.activeParticles.add(particle)
    }

    emitBinaryBits(x, y, color = '#6bff9f', count = 8) {
      if (this.reducedMotion) return
      for (let i = 0; i < count; i++) {
        const bit = this.bitParticlePool.acquire()
        if (!bit) break
        bit.setText(Math.random() > 0.5 ? '1' : '0').setColor(color).setPosition(x + Phaser.Math.Between(-30, 30), y + Phaser.Math.Between(-16, 16)).setAlpha(1).setScale(Phaser.Math.FloatBetween(0.85, 1.2)).setActive(true).setVisible(true)
        Object.assign(bit, { vx: Phaser.Math.Between(-75, 75), vy: Phaser.Math.Between(-105, -35), gravity: 175, age: 0, life: Phaser.Math.Between(480, 780), spin: Phaser.Math.FloatBetween(-5.5, 5.5), angularAcceleration: Phaser.Math.FloatBetween(-2, 2) })
        this.activeBitParticles.add(bit)
      }
    }

    updateParticles(delta) {
      const dt = Math.min(delta, 50) / 1000
      for (const particle of this.activeParticles) {
        particle.age += delta; particle.vy += particle.gravity * dt
        particle.vx *= Math.pow(0.985, dt * 60); particle.vy *= Math.pow(0.996, dt * 60)
        particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.rotation += particle.vx * dt * 0.025
        const progress = Math.min(1, particle.age / particle.life); const fade = (1 - progress) ** 2 * (1 + 2 * progress)
        particle.setAlpha(0.95 * fade).setScale(Math.max(0.15, 1 - progress))
        if (particle.age >= particle.life) { this.activeParticles.delete(particle); particle.setActive(false).setVisible(false).setAlpha(1).setScale(1).setRotation(0); this.particlePool.release(particle) }
      }
      for (const bit of this.activeBitParticles) {
        bit.age += delta; bit.vy += bit.gravity * dt
        bit.vx *= Math.pow(0.99, dt * 60); bit.vy *= Math.pow(0.997, dt * 60)
        bit.spin = (bit.spin + bit.angularAcceleration * dt) * Math.pow(0.985, dt * 60)
        bit.x += bit.vx * dt; bit.y += bit.vy * dt; bit.rotation += bit.spin * dt
        const progress = Math.min(1, bit.age / bit.life); const fade = (1 - progress) ** 2 * (1 + 2 * progress)
        bit.setAlpha(fade).setScale(Math.max(0.45, 1 - progress * 0.45))
        if (bit.age >= bit.life) { this.activeBitParticles.delete(bit); bit.setActive(false).setVisible(false).setAlpha(1).setRotation(0).setScale(1); this.bitParticlePool.release(bit) }
      }
    }

    flashBlockImpact(block, color) {
      if (this.reducedMotion || !block?.alive) return
      block.impactColor = color; block.impactFlashMs = 120
      if (this.screenShakeEnabled) this.cameras.main.shake(35, 0.0012)
    }

    emitCorrectionEffect(x, y) {
      this.emitBurst(x, y, COLORS.green)
      this.emitBinaryBits(x, y, '#6bff9f', 10)
      if (this.screenShakeEnabled && !this.reducedMotion) this.cameras.main.shake(55, 0.0018)
      this.triggerHitStop(40)
    }

    showHammingRing(x, y, radius) {
      if (this.reducedMotion) return
      const ring = this.add.circle(x, y, 7, 0x00ff86, 0.035).setStrokeStyle(2, 0x65ffad, 0.9).setDepth(9)
      this.tweens.add({ targets: ring, scale: radius / 7, alpha: 0, duration: 540, ease: 'Cubic.Out', onComplete: () => ring.destroy() })
      this.emitBinaryBits(x, y, '#74ffb2', 5)
    }

    update(time, delta) {
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
      if (this.mode !== 'playing') return
      if (this.hitStopMs > 0) {
        this.hitStopMs = Math.max(0, this.hitStopMs - delta)
        return
      }
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
      const queuedBlocks = this.blocks.length
      if (!this.congested && queuedBlocks >= 5) { this.congested = true; this.updateMusicForWave(); this.showToast('BUFFER LLENO · CONGESTIÓN') ; this.updateHud() }
      else if (this.congested && queuedBlocks <= 2) { this.congested = false; this.updateMusicForWave(); this.showToast('BUFFER ESTABLE · FLUJO NORMAL'); this.updateHud() }
      for (let blockIndex = this.blocks.length - 1; blockIndex >= 0; blockIndex--) {
        const block = this.blocks[blockIndex]
        if (!block.alive) continue
        if (block.hitError || (block.boss && block.entering)) continue
        block.disruptedMs = Math.max(0, (block.disruptedMs || 0) - delta)
        const disrupted = block.disruptedMs > 0
        block.y += block.speed * (this.congested ? BALANCE.buffer.speedMultiplier : 1) * (disrupted ? 0.58 : 1) * dt
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
      for (let shotIndex = this.shots.length - 1; shotIndex >= 0; shotIndex--) {
        const shot = this.shots[shotIndex]
        if (!shot.alive) continue
        shot.x += shot.vx * dt; shot.y += shot.vy * dt
        shot.trailTimer = (shot.trailTimer || 0) + delta
        if (shot.trailTimer >= 32) { this.emitProjectileTrail(shot); shot.trailTimer = 0 }
        if (shot.type === 'crc' && (shot.x < 10 || shot.x > W - 10)) { shot.x = Phaser.Math.Clamp(shot.x, 10, W - 10); this.bounceShot(shot, 'x'); if (!shot.alive) continue }
        if (shot.type === 'crc' && shot.y < 12) { shot.y = 12; this.bounceShot(shot, 'y'); if (!shot.alive) continue }
        if (shot.bounces >= 3 || shot.y < 0 || shot.y > H) { this.destroyShot(shot); continue }
        shot.dot.setPosition(shot.x, shot.y); shot.aura.setPosition(shot.x, shot.y); shot.sprite?.setPosition(shot.x, shot.y)
        for (let blockIndex = this.blocks.length - 1; blockIndex >= 0; blockIndex--) {
          const block = this.blocks[blockIndex]
          if (block.alive && collisionOverlapsAabb(shot.x, shot.y, shot.radius, block)) { this.hitBlock(shot, block); if (this.mode !== 'playing') return; if (!shot.alive) break }
        }
      }
      if (this.spawned >= this.waveTotal && this.blocks.length === 0) this.completeWave()
    }

    drawAimPrediction() {
      if (!this.aimGraphics || !this.player) return
      const graphics = this.aimGraphics
      const color = TYPE[this.selectedBall].color
      const size = this.selectedBall === 'crc' ? 5 : 3
      let x = this.player.x
      let y = this.player.y - 18
      let vx = Math.cos(this.aim)
      let vy = Math.sin(this.aim)
      graphics.clear()
      const drawPath = (steps, alpha) => {
        for (let i = 0; i < steps; i++) {
          x += vx * 9; y += vy * 9
          graphics.fillStyle(color, alpha * (1 - i / (steps * 1.7)))
          graphics.fillCircle(x, y, size)
          const wall = x <= 12 || x >= W - 12
          const hitBlock = this.blocks?.find((block) => block.alive && x >= block.x - block.w / 2 && x <= block.x + block.w / 2 && y >= block.y - block.h / 2 && y <= block.y + block.h / 2)
          if (wall || hitBlock) {
            if (wall) vx *= -1
            else {
              const prevX = x - vx * 9; const prevY = y - vy * 9
              if (Math.abs(prevX - hitBlock.x) / hitBlock.w > Math.abs(prevY - hitBlock.y) / hitBlock.h) vx *= -1
              else vy *= -1
            }
            return true
          }
          if (y <= 10 || y >= H - 10) return false
        }
        return false
      }
      if (drawPath(70, 0.8)) drawPath(32, 0.42)
    }

    selectBall(type) {
      if (!type || !this.equippedBalls.includes(type)) return
      this.selectedBall = type
      const names = { parity: 'PARIDAD', crc: 'CRC', hamming: 'HAMMING' }
      document.querySelector('#method-summary-status').textContent = names[type] || type.toUpperCase()
    }

    completeWave() {
      if (this.transitioning) return
      this.fadeTransition(() => this.completeWaveAfterFade())
    }

    completeWaveAfterFade() {
      if (this.wave >= 5) {
        this.slowMotionMs = 420
        if (this.screenShakeEnabled && !this.reducedMotion) this.cameras.main.shake(240, 0.003)
        if (!this.reducedMotion) this.cameras.main.flash(260, 24, 230, 225, false)
        if (!this.reducedMotion) this.tweens.add({ targets: this.cameras.main, zoom: 0.98, duration: 240, yoyo: true, onComplete: () => { this.cameras.main.zoom = 1 } })
        this.showResults(true)
        return
      }
      this.slowMotionMs = 420
      if (this.screenShakeEnabled && !this.reducedMotion) this.cameras.main.shake(220, 0.0025)
      if (!this.reducedMotion) this.cameras.main.flash(220, 24, 230, 225, false)
      if (!this.reducedMotion) this.tweens.add({ targets: this.cameras.main, zoom: 0.985, duration: 200, yoyo: true, onComplete: () => { this.cameras.main.zoom = 1 } })
      this.mode = 'upgrade'; this.showUpgrade()
    }

    showUpgrade() {
      this.hud?.setVisible(false)
      this.bossHud?.setVisible(false)
      this.bossAttackGraphics?.setVisible(false)
      this.aimGraphics?.clear().setVisible(false)
      this.actor?.setAlpha(0.46)
      const eligible = BALANCE.upgrades.filter((upgrade) => {
        if (upgrade.key === 'pierce' && !this.equippedBalls.includes('crc')) return false
        if (upgrade.key === 'hammingArea' && !this.equippedBalls.includes('hamming')) return false
        return true
      })
      const choices = Phaser.Utils.Array.Shuffle([...eligible]).slice(0, 3)
      const iconByKey = { rapid: '»', multi: '×', shield: '⬡', pierce: '↠', hammingArea: '✳', bigBall: '●', slowBlocks: '◷', scoreMagnet: '✦', extraLife: '♥' }
      upgradePanel.innerHTML = `<header class="upgrade-heading"><span>OLEADA ${this.wave} COMPLETADA</span><h2>Elige una mejora</h2></header><div class="upgrade-cards">${choices.map((choice, index) => `<button class="upgrade-card rarity-${choice.rarity === 'épica' ? 'epic' : choice.rarity === 'rara' ? 'rare' : 'common'}" data-upgrade-index="${index}" aria-label="Opción ${index + 1}: ${choice.name}, ${choice.rarity}"><span class="upgrade-key">${index + 1}</span><span class="upgrade-icon-circle"><span class="upgrade-icon">${iconByKey[choice.key] || '✦'}</span></span><strong class="upgrade-name">${choice.name}</strong><span class="upgrade-description">${choice.desc}</span><span class="upgrade-footer"><b class="upgrade-rarity">${choice.rarity.toUpperCase()}</b><small class="upgrade-synergy">${choice.synergy}</small></span></button>`).join('')}</div><p class="upgrade-hint">LEVANTA LA MANO IZQUIERDA / DERECHA / AMBAS <span>·</span> O PULSA <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd></p>`
      upgradePanel.hidden = false
      focusPanel(upgradePanel, '[data-upgrade-index]')
      upgradePanel.querySelectorAll('[data-upgrade-index]').forEach((button) => button.addEventListener('click', () => this.chooseUpgrade(Number(button.dataset.upgradeIndex))))
      this.upgradeSpecs = choices
    }

    chooseUpgrade(index) {
      if (this.mode !== 'upgrade' || this.transitioning) return
      this.fadeTransition(() => this.applyUpgrade(index))
    }

    applyUpgrade(index) {
      const choice = this.upgradeSpecs[index]
      this.playAudio('mejora')
      this.slowMotionMs = 360
      if (this.screenShakeEnabled && !this.reducedMotion) this.cameras.main.shake(120, 0.0015)
      if (!this.reducedMotion) this.tweens.add({ targets: this.cameras.main, zoom: 1.015, duration: 160, yoyo: true, onComplete: () => { this.cameras.main.zoom = 1 } })
      this.upgrades[choice.key]++
      if (choice.key === 'hammingArea') this.showHammingRing(this.player?.x ?? W / 2, this.player?.y ?? H / 2, 105 + this.upgrades.hammingArea * 35)
      upgradePanel.hidden = true; upgradePanel.innerHTML = ''; this.upgradeSpecs = null
      this.actor?.setAlpha(1)
      this.hud?.setVisible(true)
      this.bossHud?.setVisible(Boolean(this.boss?.alive))
      this.bossAttackGraphics?.setVisible(true)
      this.aimGraphics?.clear().setVisible(true)
      if (choice.key === 'extraLife') this.lives++
      this.wave++; this.mode = 'playing'; this.beginWave()
      focusGameCanvas()
    }

    pause() {
      this.fadeTransition(() => {
        this.mode = 'paused'
        pausePanel.querySelector('[data-pause-action="calibrate"]').disabled = !window.poseControl?.active
        pausePanel.hidden = false
        focusPanel(pausePanel, '[data-pause-action="resume"]')
      })
    }

    resume() { this.fadeTransition(() => { pausePanel.hidden = true; this.mode = 'playing'; focusGameCanvas() }) }

    returnToMenu() {
      if (this.transitioning) return
      this.fadeTransition(() => {
        pausePanel.hidden = true; tutorialPanel.hidden = true; this.mode = 'title'; document.querySelector('.shell').classList.remove('in-run')
        this.actor?.destroy(); this.hud?.destroy(); this.aimGraphics?.destroy(); this.bossHud?.destroy(); this.bossAttackGraphics?.destroy()
        this.blocks?.forEach((block) => block.container.destroy()); this.shots?.forEach((shot) => { shot.dot?.destroy(); shot.aura?.destroy(); shot.sprite?.destroy() })
        this.blocks = []; this.shots = []; this.boss = null; this.clearResults(); this.renderTitle(); mainMenu.hidden = false; loadoutPanel.classList.add('is-hidden'); focusPanel(mainMenu, '[data-menu-action="play"]')
      })
    }

    restartRun() {
      if (this.transitioning) return
      this.fadeTransition(() => { this.clearResults(); mainMenu.hidden = true; pausePanel.hidden = true; this.beginRun() })
    }

    finishRun(won) {
      if (this.mode === 'results' || this.resultTransition) return
      this.resultTransition = true
      this.fadeTransition(() => {
        this.resultTransition = false
        this.showResults(won)
      })
    }

    showResults(won) {
      this.mode = 'results'
      this.playAudio(won ? 'victoria' : 'derrota')
      this.resultWon = won
      const berData = calculateLedgerBer(this.metrics, 8)
      const { correctionRate } = calculateRunRates({ corrected: Math.min(this.metrics.corrected, berData.bitErrors), bitErrors: berData.bitErrors, totalBits: berData.totalBits })
      const corruptGenerated = this.metrics.corruptCreated
      const detected = Math.min(this.metrics.detected, corruptGenerated)
      const detectedRate = corruptGenerated ? Number((detected / corruptGenerated * 100).toFixed(2)) : 0
      const durationSeconds = Math.max(0, Math.round((performance.now() - this.runStartedAt) / 1000))
      const duration = `${Math.floor(durationSeconds / 60)}:${String(durationSeconds % 60).padStart(2, '0')}`
      const hasHamming = this.equippedBalls.includes('hamming')
      this.resultSummary = { initials: '', score: this.score, wave: this.wave, durationSeconds, won, equippedBalls: [...this.equippedBalls], metrics: { ...this.metrics, detected }, detected, corrected: this.metrics.corrected, lost: this.metrics.lost, detectedRate, correctionRate: hasHamming ? Number(correctionRate.toFixed(2)) : null, bitErrors: berData.bitErrors, framesGenerated: berData.framesGenerated, bitsPerFrame: berData.bitsPerFrame, totalBits: berData.totalBits, ber: berData.ber, waveMetrics: this.waveMetrics.map((entry) => ({ ...entry, detected: Math.min(entry.detected, entry.corruptCreated) })), date: new Date().toISOString() }
      const chart = this.waveMetrics.map((entry) => {
        const generated = Math.max(0, entry.created || 0)
        const corrupt = Math.max(0, entry.corruptCreated || 0)
        const detectedInWave = Math.min(Math.max(0, entry.detected || 0), corrupt)
        const correctedInWave = Math.min(Math.max(0, entry.corrected || 0), corrupt)
        const rates = [
          { label: 'BER', value: generated ? corrupt / (generated * 8) * 100 : 0, count: `${corrupt}/${generated * 8}`, color: '#ffcb57', title: 'Bits corruptos / bits generados' },
          { label: 'DETECCIÓN', value: corrupt ? detectedInWave / corrupt * 100 : 0, count: `${detectedInWave}/${corrupt}`, color: '#18e6e1', title: 'Corruptas detectadas / corruptas generadas' },
          { label: 'CORRECCIÓN', value: hasHamming && corrupt ? correctedInWave / corrupt * 100 : null, count: hasHamming ? `${correctedInWave}/${corrupt}` : 'n/a', color: '#6bff9f', title: 'Corruptas corregidas / corruptas generadas' },
        ]
        return `<div class="chart-wave"><b>OLEADA ${entry.wave}</b><div class="chart-series">${rates.map((rate) => `<div class="chart-bar-line" title="${rate.title}"><span>${rate.label}</span><div class="chart-track"><i class="wave-rate-fill" style="--rate:${rate.value ?? 0}%;--bar-color:${rate.color}"></i></div><b>${rate.value === null ? 'n/a' : `${rate.value.toFixed(0)}%`}</b><small>${rate.count}</small></div>`).join('')}</div></div>`
      }).join('')
      resultsPanel.innerHTML = `
        <header class="results-header"><span>RESULTADOS DE LA PARTIDA</span><h2>${won ? 'RED ESTABLECIDA' : 'CONEXIÓN INTERRUMPIDA'}</h2>${won ? '' : `<p class="defeat-reason">${this.defeatReason || 'Sin vidas: se agotó la resistencia del nodo.'}</p>`}<div><b>PUNTAJE ${this.score.toLocaleString('es-CO')}</b><span>OLEADA ${this.wave} / 5</span><span>DURACIÓN ${duration}</span></div></header>
        <section class="results-metrics" aria-label="Métricas de partida">
          <article><small>PROCESADAS</small><b>${this.metrics.processed}</b><span>Tramas retiradas del campo.</span></article>
          <article><small>DETECTADAS</small><b>${detected} / ${corruptGenerated}</b><span>Corruptas destruidas / corruptas generadas.</span></article>
          <article><small>PERDIDAS</small><b>${this.metrics.lost}</b><span>Corruptas que alcanzaron el nodo.</span></article>
          <article><small>% DETECTADO</small><b>${detectedRate.toFixed(2)}%</b><span>Detectadas ÷ ${corruptGenerated} corruptas generadas.</span></article>
          <article><small>% CORREGIDO</small><b>${hasHamming ? `${correctionRate.toFixed(2)}%` : 'n/a (sin Hamming)'}</b><span>${hasHamming ? 'Errores corregidos ÷ errores generados.' : 'Hamming no estaba equipado.'}</span></article>
          <article><small>BER</small><b>${berData.ber.toFixed(2)}%</b><span>${berData.framesGenerated} tramas × ${berData.bitsPerFrame} bits = ${berData.totalBits} bits generados.</span></article>
          <article><small>DISPAROS A SANAS</small><b>${this.metrics.misfires}</b><span>Impactos en tramas íntegras.</span></article>
        </section>
        <section class="results-grid">
          <article class="wave-results"><h3>RENDIMIENTO POR OLEADA</h3><div class="wave-chart">${chart}</div></article>
          <article class="link-results"><h3>CAPA DE ENLACE</h3><p><b>Paridad:</b> detecta errores en una cantidad impar de bits.</p><p><b>CRC:</b> detecta alteraciones mediante un código polinómico.</p><p><b>Hamming:</b> localiza y corrige errores de un bit.</p><p class="metrics-note">BER = ${berData.bitErrors} bits erróneos ÷ (${berData.framesGenerated} tramas × ${berData.bitsPerFrame} bits) = ${berData.bitErrors} ÷ ${berData.totalBits} = ${berData.ber.toFixed(2)}%.</p></article>
        </section>
        <section class="results-save-area"><label class="score-entry">INICIALES <input id="result-initials" maxlength="3" placeholder="ABC" aria-label="Iniciales para guardar el puntaje"><button id="save-score" disabled>GUARDAR</button><button id="export-result">EXPORTAR JSON</button><span id="save-confirmation" role="status" aria-live="polite"></span></label><div class="leaderboard"><h3>MEJORES PUNTAJES</h3><div id="results-leaderboard">${renderLeaderboard(3)}</div></div></section>
        <footer class="results-actions"><button id="results-menu">MENÚ</button><button id="results-retry">NUEVA PARTIDA</button></footer>`
      resultsPanel.classList.remove('is-animated')
      resultsPanel.hidden = false
      focusPanel(resultsPanel, '#result-initials')
      const animationToken = resultsPanel.animationToken = (resultsPanel.animationToken || 0) + 1
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!resultsPanel.hidden && resultsPanel.animationToken === animationToken) resultsPanel.classList.add('is-animated')
      }))
    }

    saveToStorage() {
      try {
        const scores = JSON.parse(localStorage.getItem('tramas-y-bloques-scores') || '[]')
        const existing = scores.findIndex((entry) => entry.date === this.resultSummary.date)
        if (existing >= 0) scores[existing] = this.resultSummary
        else scores.unshift(this.resultSummary)
        scores.sort((a, b) => b.score - a.score)
        localStorage.setItem('tramas-y-bloques-scores', JSON.stringify(scores.slice(0, 20), null, 2))
      } catch (error) { console.warn('No fue posible guardar el resultado localmente.', error) }
    }

    clearResults() {
      resultsPanel.animationToken = (resultsPanel.animationToken || 0) + 1
      resultsPanel.hidden = true; resultsPanel.classList.remove('is-animated'); resultsPanel.innerHTML = ''; this.resultSummary = null
    }

    saveResult(exportJson = false) {
      if (!this.resultSummary) return
      const saveButton = document.querySelector('#save-score')
      if (!exportJson && saveButton?.disabled) return
      this.resultSummary.initials = (document.querySelector('#result-initials')?.value || '---').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 3) || '---'
      this.saveToStorage()
      document.querySelector('#results-leaderboard').innerHTML = renderLeaderboard(3)
      if (!exportJson) {
        saveButton.textContent = 'PUNTAJE GUARDADO'
        saveButton.disabled = true
        document.querySelector('#result-initials').disabled = true
        document.querySelector('#save-confirmation').textContent = 'Puntaje guardado'
        focusPanel(resultsPanel, '#results-menu')
      }
      if (!exportJson) return
      const blob = new Blob([JSON.stringify(this.resultSummary, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a'); link.href = url; link.download = `tramas-${this.resultSummary.initials}-${this.score}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
      document.querySelector('#export-result').textContent = 'JSON DESCARGADO'
    }
  }

  const game = new Phaser.Game(createGameConfig(Phaser, FlowScene, W, H))
  window.gameInstance = game
  game.events.once('ready', () => { game.sound.volume = accessibility.volume / 100; game.sound.mute = accessibility.muted; currentScene?.syncFallbackAudioVolume(); currentScene?.updateAudioStatus() })

  cameraButton.addEventListener('click', async () => {
    cameraSection.open = true
    if (window.poseControl?.active) { window.poseControl.stop(); return }
    cameraButton.disabled = true; cameraState.textContent = 'Solicitando permiso de cámara…'
    let stream
    try {
      stream = await solicitarCamara()
      video.srcObject = stream; await video.play()
      const translator = new GestureTranslator()
      translator.configure({ smoothingAlpha: accessibility.smoothing, moveDeadZone: accessibility.deadZone })
      const worker = new Worker(`${import.meta.env.BASE_URL}vision.worker.js`)
      let resolveReady
      let rejectReady
      const ready = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject })
      const state = { active: true, ready: false, calibrating: true, calibrationEndsAt: null, calibrationCenteredFrames: 0, calibrationCandidateX: null, stream, worker, translator, raf: 0, lastVideoTime: -1, lastInferenceAt: 0, framePending: false, framePendingSince: 0, lastShot: 0, lastPoseAt: 0, startedAt: performance.now(), stop: null }
      state.calibrate = () => { translator.reset(); state.calibrating = true; state.calibrationEndsAt = null; state.calibrationCenteredFrames = 0; state.calibrationCandidateX = null; calibrationGuide.classList.remove('is-centered'); calibrationInstruction.textContent = 'CENTRA LOS HOMBROS EN EL ÓVALO'; calibrationOverlay.hidden = false; calibrationCountdown.textContent = '—'; gestureState.textContent = 'GESTO: BUSCANDO POSICIÓN'; if (currentScene) currentScene.poseTracking = false; cameraState.textContent = 'Centra los hombros y mantén la posición para iniciar la cuenta atrás' }
      state.stop = (message = 'Cámara desactivada · Teclado, ratón y gamepad disponibles') => { state.active = false; state.framePending = false; cancelAnimationFrame(state.raf); worker.terminate(); stream.getTracks().forEach((track) => track.stop()); video.srcObject = null; cameraView.classList.remove('visible'); calibrationOverlay.hidden = true; recalibrateButton.disabled = true; paintPoseSkeleton(null); cameraButton.disabled = false; cameraButton.innerHTML = '<span>◎</span> ACTIVAR CÁMARA <small>OPCIONAL</small>'; cameraState.textContent = message; gestureState.textContent = 'GESTO: —'; if (currentScene) currentScene.poseTracking = false; window.poseControl = null }
      window.poseControl = state; cameraView.classList.add('visible'); calibrationOverlay.hidden = false; recalibrateButton.disabled = false; cameraState.textContent = 'Buscando posición · permite la cámara y sigue el contorno guía'
      worker.onmessage = ({ data }) => {
        if (data.type === 'ready') { resolveReady(); return }
        if (data.type === 'error') {
          const error = new Error(data.message)
          if (!state.ready) rejectReady(error)
          else if (state.active) state.stop(`Falló MediaPipe: ${data.message.slice(0, 100)}`)
          return
        }
        if (data.type !== 'result' || !state.active) return
        state.framePending = false; state.framePendingSince = 0
        const { timestamp, poseLandmarks: marks, handLandmarks } = data
        const sample = translator.update(marks, W, handLandmarks?.length ? handLandmarks : null)
        lastGestureSample = sample
        paintPoseSkeleton(debugPanel.hidden ? null : marks)
        updateGestureDebug(sample)
        if (state.calibrating) {
          const placement = assessCalibrationPose(marks)
          const centeredAndStable = placement.centered && (state.calibrationCandidateX === null || Math.abs(placement.centerX - state.calibrationCandidateX) <= 0.025)
          if (!placement.visible || !placement.centered) {
            state.calibrationCenteredFrames = 0; state.calibrationCandidateX = null; state.calibrationEndsAt = null
            calibrationGuide.classList.remove('is-centered')
            calibrationInstruction.textContent = placement.visible ? 'CENTRA LOS HOMBROS EN EL ÓVALO' : 'MUESTRA LA CABEZA Y LOS DOS HOMBROS'
            calibrationCountdown.textContent = '—'
            cameraState.textContent = placement.visible ? 'Posición fuera del centro · ajusta el torso hasta ver el contorno cian' : 'Buscando hombros · permite que la cámara vea ambos hombros'
            gestureState.textContent = placement.visible ? 'GESTO: CENTRANDO' : 'GESTO: BUSCANDO'
            return
          }
          calibrationGuide.classList.add('is-centered')
          calibrationInstruction.textContent = state.calibrationEndsAt === null ? 'MANTÉN LOS HOMBROS CENTRADOS' : 'POSICIÓN CORRECTA · NO TE MUEVAS'
          if (centeredAndStable) state.calibrationCenteredFrames++
          else state.calibrationCenteredFrames = 1
          state.calibrationCandidateX = placement.centerX
          if (state.calibrationEndsAt === null && state.calibrationCenteredFrames >= 8) state.calibrationEndsAt = timestamp + 3000
          if (state.calibrationEndsAt === null) {
            calibrationCountdown.textContent = '···'
            cameraState.textContent = `Posición centrada · estabilizando ${Math.min(8, state.calibrationCenteredFrames)}/8`
            gestureState.textContent = 'GESTO: ESTABILIZANDO'
            return
          }
          const seconds = Math.max(0, Math.ceil((state.calibrationEndsAt - timestamp) / 1000))
          calibrationCountdown.textContent = String(seconds)
          cameraState.textContent = `Posición correcta · mantén los hombros centrados ${seconds || '…'} s`
          if (timestamp < state.calibrationEndsAt) return
          state.calibrating = false; state.lastPoseAt = timestamp; calibrationOverlay.hidden = true; translator.reset(); cameraState.textContent = 'Seguimiento activo · hombros mueven · muñeca derecha apunta · gira la izquierda para disparar'; gestureState.textContent = 'GESTO: SEGUIMIENTO'
        }
        const visible = (landmark, threshold = DEFAULT_GESTURE_THRESHOLDS.wristVisibility) => landmark && (landmark.visibility === undefined || landmark.visibility >= threshold)
        if (sample.tracked && currentScene?.mode === 'playing') {
          currentScene.poseX = sample.playerX
          currentScene.poseAim = sample.aim
          currentScene.poseTracking = true; state.lastPoseAt = timestamp
          cameraState.textContent = sample.aimDetected ? 'Seguimiento activo · hombros mueven · muñeca derecha apunta · gira la izquierda para disparar' : 'Hombros detectados · muestra la mano derecha para apuntar'
          gestureState.textContent = sample.throwPressed ? 'GESTO: DISPARO' : sample.leftRaised ? 'GESTO: MANO IZQUIERDA' : sample.aimDetected ? 'GESTO: APUNTANDO' : 'GESTO: SEGUIMIENTO'
          if (sample.throwPressed && timestamp - state.lastShot > accessibility.temporalMs) { currentScene.fire(); state.lastShot = timestamp }
        } else if (!sample.tracked) {
          gestureState.textContent = 'GESTO: PERDIDO'
          if (!state.calibrating) cameraState.textContent = 'Señal perdida · vuelve al contorno; teclado, ratón y gamepad siguen activos'
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
      cameraButton.disabled = false; cameraButton.innerHTML = '<span>◉</span> DESACTIVAR CÁMARA'; recalibrateButton.disabled = false
      stream.getVideoTracks()[0]?.addEventListener('ended', () => { if (state.active) state.stop() }, { once: true })
      const frame = (now) => {
        if (!state.active) return
        if (state.framePending && now - state.framePendingSince > 2000) {
          state.stop('La visión dejó de responder · reinicia la cámara; teclado, ratón y gamepad siguen disponibles')
          return
        }
        if (!state.framePending && video.currentTime !== state.lastVideoTime && now - state.lastInferenceAt >= 1000 / 30) {
          state.lastVideoTime = video.currentTime
          state.lastInferenceAt = now
          state.framePending = true
          state.framePendingSince = now
          createImageBitmap(video, { resizeWidth: 320, resizeHeight: 240, resizeQuality: 'low' }).then((bitmap) => {
            if (!state.active) { bitmap.close(); state.framePending = false; state.framePendingSince = 0; return }
            try {
              // Transfer ownership: the bitmap leaves the main thread, avoiding copies and never queuing frames.
              worker.postMessage({ type: 'frame', timestamp: now, bitmap }, [bitmap])
            } catch (error) {
              bitmap.close(); state.framePending = false; state.framePendingSince = 0
              state.stop(`No se pudo enviar el cuadro al hilo de visión · ${error.message || 'error de transferencia'}`)
            }
          }).catch((error) => { state.framePending = false; state.framePendingSince = 0; console.warn('No fue posible capturar un cuadro de cámara.', error) })
        }
        if (currentScene?.mode === 'playing') {
          if (!state.calibrating && state.lastPoseAt && now - state.lastPoseAt > 1200) {
            currentScene.poseTracking = false
            cameraState.textContent = 'Seguimiento perdido · centra cabeza y hombros; controles alternativos disponibles'
          } else if (!state.calibrating && !state.lastPoseAt && now - state.startedAt > 3000) {
            cameraState.textContent = 'No detecto hombros · aléjate y centra el torso en cámara'
          }
        }
        state.raf = requestAnimationFrame(frame)
      }
      state.raf = requestAnimationFrame(frame)
    } catch (error) {
      console.error(error); window.poseControl?.stop?.(); stream?.getTracks().forEach((track) => track.stop()); video.srcObject = null; cameraView.classList.remove('visible'); cameraButton.disabled = false; window.poseControl = null
      const detail = error instanceof Error ? ` · ${error.message.slice(0, 90)}` : ''
      recalibrateButton.disabled = true
      cameraState.textContent = error.name === 'NotAllowedError' ? 'Permiso denegado. Puedes continuar con teclado, ratón o gamepad y permitirla desde el icono de cámara del navegador.' : `No se pudo iniciar la cámara · comprueba conexión y permisos. Teclado, ratón y gamepad disponibles${detail}`
      cameraButton.innerHTML = '<span>◎</span> REINTENTAR CÁMARA <small>OPCIONAL</small>'
    }
  })

  recalibrateButton.addEventListener('click', () => window.poseControl?.calibrate?.())

  window.addEventListener('pointerdown', resumeAudioFromUserGesture, { capture: true })
  window.addEventListener('beforeunload', () => { window.poseControl?.stop(); game.destroy(true) })
}
