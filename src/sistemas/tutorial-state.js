export const TUTORIAL_SEEN_KEY = 'tutorialVisto'
const LEGACY_TUTORIAL_KEY = 'tramas-tutorial-complete'

export function hasSeenTutorial(value) { return value === 'true' }

export function shouldShowTutorial(value) { return !hasSeenTutorial(value) }

export function readTutorialSeen(storage) {
  try {
    const current = storage.getItem(TUTORIAL_SEEN_KEY)
    if (current !== null) return hasSeenTutorial(current)
    const legacy = storage.getItem(LEGACY_TUTORIAL_KEY)
    return hasSeenTutorial(legacy)
  } catch { return false }
}

export function completeTutorial(storage, action) {
  if (!['complete', 'skip'].includes(action)) return false
  try { storage.setItem(TUTORIAL_SEEN_KEY, 'true'); return true }
  catch { return false }
}
