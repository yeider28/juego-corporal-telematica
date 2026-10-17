import { test } from 'node:test'
import assert from 'node:assert/strict'
import { OPTIONAL_SPRITES, probeOptionalSprites } from '../src/sistemas/sprites.js'

test('el cargador opcional conserva solo sprites existentes y omite fallos de red silenciosamente', async () => {
  const found = await probeOptionalSprites('/base/', async (url, options) => {
    assert.equal(options.method, 'HEAD')
    return { ok: url.endsWith(OPTIONAL_SPRITES[0][1]) }
  })
  assert.deepEqual([...found], [OPTIONAL_SPRITES[0][1]])
  const offline = await probeOptionalSprites('/', async () => { throw new Error('offline') })
  assert.equal(offline.size, 0)
})
