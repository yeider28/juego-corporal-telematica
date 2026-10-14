export function solicitarCamara() {
  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'user',
      width: { ideal: 480 },
      height: { ideal: 360 },
      frameRate: { ideal: 24, max: 30 },
    },
    audio: false,
  })
}
