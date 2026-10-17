let poseLandmarker
let handLandmarker
let canvas
let context
let cachedHandLandmarks = null
let frameCount = 0

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'init') {
      const response = await fetch(data.bundleUrl, { integrity: data.bundleIntegrity })
      if (!response.ok) throw new Error(`No se pudo descargar MediaPipe (${response.status}).`)
      const module = { exports: {} }
      new Function('exports', 'module', await response.text())(module.exports, module)
      const { FilesetResolver, PoseLandmarker, HandLandmarker } = module.exports
      const files = await FilesetResolver.forVisionTasks(data.wasmUrl)
      poseLandmarker = await PoseLandmarker.createFromOptions(files, {
        runningMode: 'VIDEO', numPoses: 1,
        minPoseDetectionConfidence: 0.35, minPosePresenceConfidence: 0.35, minTrackingConfidence: 0.35,
        baseOptions: { modelAssetPath: data.poseModelUrl, delegate: 'CPU' },
      })
      handLandmarker = await HandLandmarker.createFromOptions(files, {
        runningMode: 'VIDEO', numHands: 2,
        minHandDetectionConfidence: 0.35, minHandPresenceConfidence: 0.35, minTrackingConfidence: 0.35,
        baseOptions: { modelAssetPath: data.handModelUrl, delegate: 'CPU' },
      })
      cachedHandLandmarks = null
      frameCount = 0
      canvas = new OffscreenCanvas(1, 1)
      context = canvas.getContext('2d', { alpha: false })
      self.postMessage({ type: 'ready' })
      return
    }

    if (data.type === 'frame' && poseLandmarker && handLandmarker) {
      const { bitmap, timestamp } = data
      if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) {
        canvas.width = bitmap.width
        canvas.height = bitmap.height
      }
      context.drawImage(bitmap, 0, 0)
      bitmap.close()
      const pose = poseLandmarker.detectForVideo(canvas, timestamp)
      // Hand tracking is only needed to detect wrist rotation. Run it every
      // other frame, while keeping pose tracking responsive on every frame.
      if (frameCount++ % 2 === 0) {
        const hands = handLandmarker.detectForVideo(canvas, timestamp)
        cachedHandLandmarks = hands.landmarks ?? null
      }
      self.postMessage({ type: 'result', timestamp, poseLandmarks: pose.landmarks?.[0] ?? null, handLandmarks: cachedHandLandmarks })
    }
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) })
  }
}
