import test from 'node:test'
import assert from 'node:assert/strict'
import { createObjectPool } from '../src/entidades/object-pool.js'

test('el pool reutiliza objetos y no supera su límite', () => {
  let created = 0
  const pool = createObjectPool(() => ({ id: ++created }), 2)
  const first = pool.acquire()
  const second = pool.acquire()
  assert.equal(pool.acquire(), null)
  pool.release(first)
  assert.equal(pool.acquire(), first)
  assert.equal(created, 2)
  assert.equal(second.id, 2)
  assert.equal(pool.activeCount, 2)
  assert.equal(pool.release(first), true)
  assert.equal(pool.release(first), false, 'un objeto no debe aparecer duplicado en la lista libre')
  assert.equal(pool.activeCount, 1)
  assert.equal(pool.acquire(), first)
  assert.equal(pool.availableCount, 0)
})

test('el pool puede precalentar su cupo y reutilizarlo sin crear objetos nuevos', () => {
  let created = 0
  const pool = createObjectPool(() => ({ id: ++created }), 3)
  assert.equal(pool.prewarm(), 3)
  assert.equal(pool.availableCount, 3)
  const values = [pool.acquire(), pool.acquire(), pool.acquire()]
  assert.equal(pool.acquire(), null)
  values.forEach((value) => pool.release(value))
  assert.equal(pool.prewarm(), 3)
  assert.equal(created, 3)
  assert.equal(pool.availableCount, 3)
})
