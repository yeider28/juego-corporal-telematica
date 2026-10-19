export function createObjectPool(factory, limit) {
  if (typeof factory !== 'function') throw new TypeError('El pool requiere una factory.')
  if (!Number.isInteger(limit) || limit < 0) throw new RangeError('El límite del pool debe ser un entero no negativo.')
  const available = []
  const acquired = new Set()
  let created = 0
  const pool = {
    acquire() {
      if (available.length) {
        const item = available.pop()
        acquired.add(item)
        return item
      }
      if (created >= limit) return null
      created++
      let item
      try { item = factory() } catch (error) { created--; throw error }
      if (item == null) { created--; return null }
      acquired.add(item)
      return item
    },
    release(item) {
      if (!item || !acquired.has(item) || available.length >= limit) return false
      acquired.delete(item)
      available.push(item)
      return true
    },
    clear() { available.length = 0; acquired.clear(); created = 0 },
    prewarm(count = limit) {
      const target = Math.min(limit, Math.max(0, Math.floor(count)))
      const items = []
      while (created < target) {
        const item = pool.acquire()
        if (!item) break
        items.push(item)
      }
      for (const item of items) pool.release(item)
      return created
    },
    get availableCount() { return available.length },
    get activeCount() { return acquired.size },
    get createdCount() { return created },
  }
  return pool
}
