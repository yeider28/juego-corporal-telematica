import { UI } from '../config/ui.js'

export function renderMenuTitle(scene, width, height) {
  const title = UI.menuTitle
  scene.mode = 'title'
  scene.titleShade = scene.add.rectangle(width / 2, height / 2, width, height, title.shade.color, title.shade.alpha)
  scene.titleTop = scene.text(width / 2, title.top.y, 'SIMULADOR DE INTEGRIDAD // 001', title.top.size, title.top.color, { originX: 0.5, letterSpacing: title.top.letterSpacing })
  scene.titleMain = scene.text(width / 2, title.main.y, 'TRAMAS Y BLOQUES', title.main.size, title.main.color, { originX: 0.5, fontStyle: 'bold', letterSpacing: title.main.letterSpacing })
  scene.titleSub = scene.text(width / 2, title.subtitle.y, 'EL RUIDO ESTÁ EN LA LÍNEA. ¿PUEDES DETECTARLO?', title.subtitle.size, title.subtitle.color, { originX: 0.5, letterSpacing: title.subtitle.letterSpacing })
  scene.titlePrompt = scene.text(width / 2, title.prompt.y, 'CONFIGURA TU LOADOUT PARA INICIAR', title.prompt.size, title.prompt.color, { originX: 0.5 })
  scene.titleHelp = scene.text(width / 2, title.help.y, '5 oleadas · 5 vidas · usa cámara o teclado', title.help.size, title.help.color, { originX: 0.5 })
  if (!scene.reducedMotion) scene.tweens.add({ targets: scene.titlePrompt, alpha: title.pulse.alpha, duration: title.pulse.durationMs, yoyo: true, repeat: -1 })
}
