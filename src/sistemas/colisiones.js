export function collisionOverlapsAabb(x, y, radius, block) {
  return Math.abs(x - block.x) < block.w / 2 + radius && Math.abs(y - block.y) < block.h / 2 + radius
}
