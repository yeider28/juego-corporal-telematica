import test from 'node:test'
import assert from 'node:assert/strict'
import { audioControlsState } from '../src/sistemas/audio-controls.js'
import { createGlobalKeyBinding, dispatchGlobalKey } from '../src/sistemas/global-keys.js'
import { completeTutorial, readTutorialSeen, shouldShowTutorial, TUTORIAL_SEEN_KEY } from '../src/sistemas/tutorial-state.js'
import { clearGameStorage } from '../src/sistemas/game-storage.js'

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null },
    setItem(key, value) { values.set(key, String(value)) },
    removeItem(key) { values.delete(key) },
    key(index) { return [...values.keys()][index] ?? null },
    get length() { return values.size },
  }
}

test('M alterna el silencio y sincroniza indicador, botón y volumen efectivo', () => {
  let muted = false
  let phaserMuted = false
  let fallbackGain = 0.7
  let rendered = audioControlsState(muted, 70)
  const handled = dispatchGlobalKey({ code: 'KeyM', preventDefault() {} }, {
    toggleMute() {
      muted = !muted
      phaserMuted = muted
      fallbackGain = muted ? 0 : 0.7
      rendered = audioControlsState(muted, 70)
    },
  })
  assert.equal(handled, true)
  assert.equal(phaserMuted, true)
  assert.equal(fallbackGain, 0)
  assert.equal(rendered.header, '· AUDIO: MUTE')
  assert.equal(rendered.button, 'ACTIVAR SONIDO (M)')
  assert.equal(rendered.effectiveVolume, 0)
  dispatchGlobalKey({ code: 'KeyM', preventDefault() {} }, { toggleMute() { muted = !muted; rendered = audioControlsState(muted, 70) } })
  assert.equal(audioControlsState(muted, 70).button, 'SILENCIAR (M)')
  assert.equal(rendered.effectiveVolume, 70)
})

test('V alterna temblor sin Reducir movimiento y muestra aviso cuando está activo', () => {
  let shakeToggles = 0
  let notice = ''
  const actions = { isReducedMotion: () => false, toggleShake: () => shakeToggles++, onMotionBlocked: (message) => { notice = message } }
  dispatchGlobalKey({ code: 'KeyV', preventDefault() {} }, actions)
  assert.equal(shakeToggles, 1)
  actions.isReducedMotion = () => true
  actions.onMotionBlocked = () => { notice = 'Temblor bloqueado por Reducir movimiento' }
  dispatchGlobalKey({ code: 'KeyV', preventDefault() {} }, actions)
  assert.equal(shakeToggles, 1)
  assert.equal(notice, 'Temblor bloqueado por Reducir movimiento')
})

test('los atajos se ignoran solo en controles de edición de texto', () => {
  let toggles = 0
  const actions = { toggleMute: () => toggles++ }
  for (const target of [{ tagName: 'INPUT', type: 'text' }, { tagName: 'TEXTAREA' }]) {
    assert.equal(dispatchGlobalKey({ code: 'KeyM', target }, actions), false)
  }
  for (const target of [{ tagName: 'INPUT', type: 'range' }, { tagName: 'INPUT', type: 'checkbox' }, { tagName: 'SELECT' }, { tagName: 'BUTTON' }]) {
    assert.equal(dispatchGlobalKey({ code: 'KeyM', target, preventDefault() {} }, actions), true)
  }
  assert.equal(toggles, 4)
})

test('registrar de nuevo el manejador global no duplica listeners y shutdown lo retira', () => {
  const listeners = new Set()
  const target = { addEventListener: (_type, listener) => listeners.add(listener), removeEventListener: (_type, listener) => listeners.delete(listener) }
  const binding = createGlobalKeyBinding(target, {})
  binding.register(); binding.register()
  assert.equal(listeners.size, 1)
  binding.unregister()
  assert.equal(listeners.size, 0)
})

test('tutorial aparece si falta la bandera o está corrupta; se oculta al completar o saltar', () => {
  const storage = memoryStorage()
  assert.equal(readTutorialSeen(storage), false)
  assert.equal(shouldShowTutorial(storage.getItem(TUTORIAL_SEEN_KEY)), true)
  assert.equal(storage.getItem(TUTORIAL_SEEN_KEY), null, 'mostrarlo no debe persistir la bandera')
  assert.equal(completeTutorial(storage, 'shown'), false, 'mostrarlo no cuenta como completar ni saltar')
  assert.equal(storage.getItem(TUTORIAL_SEEN_KEY), null)
  storage.setItem(TUTORIAL_SEEN_KEY, 'dato corrupto')
  assert.equal(readTutorialSeen(storage), false)
  assert.equal(shouldShowTutorial(storage.getItem(TUTORIAL_SEEN_KEY)), true)
  assert.equal(completeTutorial(storage, 'complete'), true)
  assert.equal(readTutorialSeen(storage), true)
  assert.equal(shouldShowTutorial(storage.getItem(TUTORIAL_SEEN_KEY)), false)
  storage.setItem(TUTORIAL_SEEN_KEY, 'false')
  assert.equal(completeTutorial(storage, 'skip'), true)
  assert.equal(readTutorialSeen(storage), true)
})

test('leer la bandera histórica no escribe tutorialVisto', () => {
  const storage = memoryStorage({ 'tramas-tutorial-complete': 'true' })
  assert.equal(readTutorialSeen(storage), true)
  assert.equal(storage.getItem(TUTORIAL_SEEN_KEY), null)
})

test('restablecer elimina todas las claves del juego y conserva las de otros sitios', () => {
  const storage = memoryStorage({
    'tramas-accessibility-v1': '{}',
    'tramas-screen-shake': 'false',
    'tramas-y-bloques-scores': '[]',
    tutorialVisto: 'true',
    unrelated: 'keep',
  })
  clearGameStorage(storage)
  assert.equal(storage.getItem('tramas-accessibility-v1'), null)
  assert.equal(storage.getItem('tramas-screen-shake'), null)
  assert.equal(storage.getItem('tramas-y-bloques-scores'), null)
  assert.equal(storage.getItem(TUTORIAL_SEEN_KEY), null)
  assert.equal(storage.getItem('unrelated'), 'keep')
})
