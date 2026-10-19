import { UI } from '../config/ui.js'

export function renderLoadoutSelection(selection, root = document) {
  root.querySelectorAll('[data-loadout-ball]').forEach((button) => {
    const selected = selection.balls.includes(button.dataset.loadoutBall)
    button.classList.toggle('is-selected', selected)
    button.setAttribute('aria-pressed', String(selected))
    button.disabled = selected && selection.balls.length <= UI.loadout.minimumMethods
    const status = button.querySelector('.loadout-status')
    status.textContent = selected ? '✓ Equipado' : selection.balls.length >= UI.loadout.maxMethods ? `Máximo ${UI.loadout.maxMethods} alcanzado · Toca para intercambiar` : 'Toca para equipar'
  })
  root.querySelectorAll('[data-loadout-perk]').forEach((button) => {
    const selected = button.dataset.loadoutPerk === selection.perk
    button.classList.toggle('is-selected', selected)
    button.setAttribute('aria-pressed', String(selected))
  })
  root.querySelectorAll('[data-difficulty]').forEach((button) => {
    const selected = button.dataset.difficulty === selection.difficulty
    button.classList.toggle('is-selected', selected)
    button.setAttribute('aria-pressed', String(selected))
  })
}
