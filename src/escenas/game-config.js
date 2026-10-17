export function createGameConfig(Phaser, FlowScene, width, height) {
  return {
    type: Phaser.AUTO,
    parent: 'game',
    width,
    height,
    backgroundColor: '#08121f',
    antialias: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { pixelArt: false, roundPixels: true },
    scene: [FlowScene],
  }
}
