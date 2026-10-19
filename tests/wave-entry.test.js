import test from 'node:test'
import assert from 'node:assert/strict'
import { BALANCE } from '../src/config/balance.js'
import { spawnBlock } from '../src/sistemas/entrada.js'
import { beginWave } from '../src/sistemas/oleadas.js'

test('una llamada a spawnBlock crea como máximo una trama aunque queden muchas pendientes', () => {
  const scene = {
    wave: 1,
    spawned: 0,
    waveTotal: 10_000,
    created: 0,
    createBlock(x, y, corrupted) {
      this.created++
      return { x, y, corrupted }
    },
  }

  spawnBlock(scene, BALANCE, 960)

  assert.equal(scene.created, 1)
  assert.equal(scene.spawned, 1)
})

test('spawnBlock no busca coordenadas mediante reintentos cuando el campo está lleno', () => {
  let attempts = 0
  const scene = {
    wave: 1,
    spawned: 0,
    waveTotal: 10_000,
    createBlock() { attempts++; return null },
  }

  spawnBlock(scene, BALANCE, 960)

  assert.equal(attempts, 1)
  assert.equal(scene.spawned, 0)
})

test('beginWave reporta estado o configuración inválida antes de tocar la escena', () => {
  assert.throws(() => beginWave({ wave: 1 }, BALANCE), /escena no está lista/)
  assert.throws(() => beginWave({ wave: 99 }, BALANCE), /Configuración inválida/)
})
