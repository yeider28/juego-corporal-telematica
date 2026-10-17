export function createObjectPool(factory, limit) {
  const available = []
  let created = 0
  return {
    acquire() {
      if (available.length) return available.pop()
      if (created >= limit) return null
      created++
      return factory()
    },
    release(item) {
      if (item && available.length < limit) available.push(item)
    },
    get availableCount() { return available.length },
    get createdCount() { return created },
  }
}
