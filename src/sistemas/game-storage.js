export function clearGameStorage(storage) {
  try {
    const keys = []
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index)
      if (key === 'tutorialVisto' || key?.startsWith('tramas-')) keys.push(key)
    }
    for (const key of keys) storage.removeItem(key)
    return keys
  } catch { return [] }
}
