import { BALANCE } from '../config/balance.js'

export function congestionState(current, activeBlocks) {
  if (!current && activeBlocks >= BALANCE.buffer.congestionAt) return true
  if (current && activeBlocks <= BALANCE.buffer.recoverAt) return false
  return current
}
