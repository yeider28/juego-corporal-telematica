export function isTextEditingTarget(target) {
  const tag = String(target?.tagName || '').toUpperCase()
  if (tag === 'TEXTAREA') return true
  return tag === 'INPUT' && String(target.type || 'text').toLowerCase() === 'text'
}

export function dispatchGlobalKey(event, actions) {
  if (isTextEditingTarget(event.target)) return false
  if (['ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault?.()
  if (event.repeat) return false
  const handled = ['KeyM', 'KeyV', 'KeyD', 'Escape'].includes(event.code)
  if (!handled) return false
  event.preventDefault?.()
  try {
    switch (event.code) {
      case 'KeyM': actions.toggleMute?.(); break
      case 'KeyV':
        if (actions.isReducedMotion?.()) actions.onMotionBlocked?.()
        else actions.toggleShake?.()
        break
      case 'KeyD': actions.toggleDebug?.(); break
      case 'Escape': actions.escape?.(); break
    }
  } catch (error) {
    try {
      if (typeof actions.onError === 'function') actions.onError(error, event)
      else console.error(`Falló el atajo global ${event.code}.`, error)
    } catch (reportError) {
      console.error(`Falló el atajo global ${event.code} y su reporte de error.`, error, reportError)
    }
  }
  return true
}

export function createGlobalKeyBinding(target, actions) {
  let registered = false
  const listener = (event) => dispatchGlobalKey(event, actions)
  return {
    register() {
      this.unregister()
      target.addEventListener('keydown', listener)
      registered = true
    },
    unregister() {
      if (registered) target.removeEventListener('keydown', listener)
      registered = false
    },
    get registered() { return registered },
  }
}
