export const UI = Object.freeze({
  menuTitle: {
    shade: { color: 0x06111e, alpha: 0.62 },
    top: { y: 150, size: 13, color: '#18e6e1', letterSpacing: 3 },
    main: { y: 205, size: 43, color: '#eaf8ff', letterSpacing: 3 },
    subtitle: { y: 263, size: 13, color: '#8da6b9', letterSpacing: 1 },
    prompt: { y: 352, size: 15, color: '#18e6e1' },
    help: { y: 390, size: 12, color: '#8da6b9' },
    pulse: { alpha: 0.25, durationMs: 720 },
  },
  resultDuration: { secondsPerMinute: 60, minutePadding: 2 },
  loadout: { maxMethods: 2, minimumMethods: 1 },
  upgrades: {
    choicesPerScreen: 3,
    keyboardKeys: [1, 2, 3],
    icons: { rapid: '»', multi: '×', shield: '⬡', pierce: '↠', hammingArea: '✳', bigBall: '●', slowBlocks: '◷', scoreMagnet: '✦', extraLife: '♥' },
  },
})
