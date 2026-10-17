export const OPTIONAL_SPRITES = Object.freeze([
  ['sprite-node', 'protagonista_quieto.png', 64, 64],
  ['sprite-healthy', 'trama_sana_bajando.png', 64, 32],
  ['sprite-corrupt', 'trama_corrupta_error.png', 64, 32],
  ['sprite-boss', 'jefe_masivo.png', 192, 96],
  ['sprite-projectiles', 'proyectiles_tipos.png', 32, 32],
  ['sprite-far', 'fondo_lejano.png', 1280, 720],
  ['sprite-parallax', 'fondo_parallax.png', 1280, 720],
  ['sprite-near', 'fondo_cercano.png', 1280, 720],
  ['sprite-circuits', 'tileset_circuitos.png', 256, 256],
  ['sprite-ui', 'ui_elementos.png', 512, 64],
])

export async function probeOptionalSprites(baseUrl, fetcher = globalThis.fetch) {
  if (typeof fetcher !== 'function') return new Set()
  const checks = await Promise.all(OPTIONAL_SPRITES.map(async ([, file]) => {
    try {
      const response = await fetcher(`${baseUrl}assets/sprites/${file}`, { method: 'HEAD', cache: 'no-store' })
      return response.ok ? file : null
    } catch { return null }
  }))
  return new Set(checks.filter(Boolean))
}
