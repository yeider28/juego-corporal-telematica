export function resolveTabFocus(focusables, activeElement, shiftKey = false, fallback = null) {
  if (!focusables.length) return fallback
  const currentIndex = focusables.indexOf(activeElement)
  if (currentIndex < 0) return shiftKey ? focusables.at(-1) : focusables[0]
  if (shiftKey && currentIndex === 0) return focusables.at(-1)
  if (!shiftKey && currentIndex === focusables.length - 1) return focusables[0]
  return null
}
