/** Balance central del juego. Los multiplicadores de dificultad se aplican
 * sobre estos valores base para conservar una curva legible y ajustable. */
export const BALANCE = Object.freeze({
  targetDurationSeconds: 240,
  player: { lives: 5, moveSpeed: 320, moveAcceleration: 1450, moveDeceleration: 1850, poseFollowSpeed: 3.4, mouseFollowSpeed: 3.9, damage: 1, invulnerabilityMs: 900 },
  combat: { damage: 1, shotSpeed: 420, crcShotSpeed: 390, shotCooldownSeconds: 0.34, minShotCooldownSeconds: 0.11, rapidReductionSeconds: 0.055, spamHeatPerShot: 0.12, spamHeatDecayPerSecond: 0.28, maxHeatCooldownSeconds: 0.8 },
  score: { corruptParity: 60, corruptCrc: 90, healthyPenalty: 50, hammingHealthyPenalty: 25, hammingCorrection: 125, bossHit: 20, bossDefeat: 500, precisionComboThreshold: 3, comboMultiplierStep: 0.25, maxComboMultiplier: 3 },
  buffer: { congestionAt: 5, recoverAt: 2, speedMultiplier: 1.5 },
  powerUps: { types: ['shield', 'slow'], maxActive: 4, dropChance: 0.14, fallSpeed: 110, catchRadius: 30, shieldDurationMs: 12000, slowDurationMs: 9000, slowSpeedMultiplier: 0.55 },
  waves: [
    null,
    { count: 18, speed: 42, corruptChance: 0.47, spawnInterval: 1.5, feature: 'Tramas básicas' },
    { count: 22, speed: 50, corruptChance: 0.47, spawnInterval: 1.4, feature: 'Flujo más rápido' },
    { count: 32, speed: 53, corruptChance: 0.32, spawnInterval: 1.6, feature: 'Más tramas sanas: apunta con precisión' },
    { count: 36, speed: 59, corruptChance: 0.42, spawnInterval: 1.45, feature: 'Tramas en zigzag y división' },
    { count: 9, speed: 13, corruptChance: 1, spawnInterval: 0, bossHealth: 12, feature: 'Jefe de enlace' },
  ],
  difficulty: {
    easy: { label: 'Fácil', speedMultiplier: 0.82, lives: 7 },
    normal: { label: 'Normal', speedMultiplier: 1, lives: 5 },
    hard: { label: 'Difícil', speedMultiplier: 1.22, lives: 3 },
  },
  upgrades: [
    { key: 'rapid', name: 'DISPARO RÁPIDO', icon: '»', rarity: 'común', desc: 'Reduce el enfriamiento del disparo.', synergy: 'Sinergia: abanico múltiple', color: 0x18e6e1 },
    { key: 'multi', name: 'DOBLE PAQUETE', icon: '⋈', rarity: 'rara', desc: 'Lanza dos bolas extra en abanico.', synergy: 'Sinergia: disparo rápido', color: 0x6979ff },
    { key: 'shield', name: 'ESCUDO DE RED', icon: '⬡', rarity: 'común', desc: 'Evita una pérdida de vida.', synergy: 'Sinergia: dificultad alta', color: 0xffcb57 },
    { key: 'pierce', name: 'CRC PERFORANTE', icon: '⬢', rarity: 'épica', desc: 'CRC atraviesa una trama adicional.', synergy: 'Requiere CRC equipado', color: 0x9b8cff },
    { key: 'hammingArea', name: 'HAMMING EN ÁREA', icon: '✳', rarity: 'épica', desc: 'Hamming corrige tramas cercanas.', synergy: 'Requiere Hamming equipado', color: 0xffcb57 },
    { key: 'bigBall', name: 'BOLA AMPLIADA', icon: '●', rarity: 'rara', desc: 'Aumenta el radio de impacto.', synergy: 'Sinergia: precisión', color: 0x18e6e1 },
    { key: 'slowBlocks', name: 'CONTROL DE FLUJO', icon: '◷', rarity: 'rara', desc: 'Reduce la velocidad de las tramas.', synergy: 'Sinergia: buffer congestionado', color: 0x6bff9f },
    { key: 'scoreMagnet', name: 'IMÁN DE PUNTOS', icon: '✦', rarity: 'común', desc: 'Aumenta la recompensa por precisión.', synergy: 'Sinergia: rachas largas', color: 0xffcb57 },
    { key: 'extraLife', name: 'VIDA EXTRA', icon: '♥', rarity: 'rara', desc: 'Añade una vida al nodo.', synergy: 'Sinergia: cualquier método', color: 0xff416d },
    { key: 'fusionParity', name: 'FUSIÓN PARIDAD', icon: '⊕', rarity: 'épica', desc: 'Combina dos bolas Paridad del disparo múltiple y evoluciona Paridad.', synergy: 'Requiere Paridad equipada y Doble paquete', color: 0x18e6e1 },
    { key: 'fusionCrc', name: 'FUSIÓN CRC', icon: '⬡', rarity: 'épica', desc: 'Combina dos bolas CRC del disparo múltiple y evoluciona CRC.', synergy: 'Requiere CRC equipado y Doble paquete', color: 0x6979ff },
    { key: 'fusionHamming', name: 'FUSIÓN HAMMING', icon: '✳', rarity: 'épica', desc: 'Combina dos bolas Hamming del disparo múltiple y evoluciona Hamming.', synergy: 'Requiere Hamming equipado y Doble paquete', color: 0xffcb57 },
  ],
})
