import { UI } from '../config/ui.js'

export function formatRunDuration(seconds) {
  return `${Math.floor(seconds / UI.resultDuration.secondsPerMinute)}:${String(seconds % UI.resultDuration.secondsPerMinute).padStart(UI.resultDuration.minutePadding, '0')}`
}
