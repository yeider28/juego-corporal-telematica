import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveTabFocus } from '../src/sistemas/focus-trap.js'

test('Tab y Shift+Tab permanecen dentro del modal en ambos extremos', () => {
  const first = {}; const middle = {}; const last = {}
  const focusables = [first, middle, last]
  assert.equal(resolveTabFocus(focusables, last), first)
  assert.equal(resolveTabFocus(focusables, first, true), last)
  assert.equal(resolveTabFocus(focusables, middle), null, 'el navegador conserva su avance natural dentro del modal')
})

test('Tab entra al modal desde fuera y enfoca el propio diálogo si no tiene controles', () => {
  const first = {}; const last = {}; const outside = {}; const fallback = {}
  assert.equal(resolveTabFocus([first, last], outside), first)
  assert.equal(resolveTabFocus([first, last], outside, true), last)
  assert.equal(resolveTabFocus([], outside, false, fallback), fallback)
  assert.equal(resolveTabFocus([], outside, true, fallback), fallback)
})
