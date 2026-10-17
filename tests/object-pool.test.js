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
})
