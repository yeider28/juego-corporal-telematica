let poseLandmarker
let handLandmarker
let canvas
let context
let cachedHandLandmarks = null
let frameCount = 0

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'init') {
      let response
      let bundleSource = ''
      for (const url of [data.localBundleUrl, data.bundleUrl].filter(Boolean)) {
        try {
          const isCdn = url === data.bundleUrl
          response = await fetch(url, isCdn && data.bundleIntegrity ? { integrity: data.bundleIntegrity } : undefined)
          if (response.ok) { bundleSource = await response.text(); break }
        } catch {}
      }
      if (!bundleSource) throw new Error('No se pudo cargar MediaPipe. Comprueba la conexión o instala la copia local opcional en public/vendor/mediapipe/.')
      const module = { exports: {} }
      new Function('exports', 'module', bundleSource)(module.exports, module)
      const { FilesetResolver, PoseLandmarker, HandLandmarker } = module.exports
      const poseOptions = { runningMode: 'VIDEO', numPoses: 1, minPoseDetectionConfidence: 0.35, minPosePresenceConfidence: 0.35, minTrackingConfidence: 0.35 }
      const handOptions = { runningMode: 'VIDEO', numHands: 2, minHandDetectionConfidence: 0.35, minHandPresenceConfidence: 0.35, minTrackingConfidence: 0.35 }
      const createLandmarkers = async (wasmUrl, poseModelUrl, handModelUrl) => {
        const files = await FilesetResolver.forVisionTasks(wasmUrl)
        const pose = await PoseLandmarker.createFromOptions(files, { ...poseOptions, baseOptions: { modelAssetPath: poseModelUrl, delegate: 'CPU' } })
        try {
          const hand = await HandLandmarker.createFromOptions(files, { ...handOptions, baseOptions: { modelAssetPath: handModelUrl, delegate: 'CPU' } })
          return { pose, hand }
        } catch (error) { pose.close?.(); throw error }
      }
      let landmarkers
      try { landmarkers = await createLandmarkers(data.localWasmUrl, data.localPoseModelUrl, data.localHandModelUrl) }
      catch { landmarkers = await createLandmarkers(data.wasmUrl, data.poseModelUrl, data.handModelUrl) }
      poseLandmarker = landmarkers.pose
      handLandmarker = landmarkers.hand
      cachedHandLandmarks = null
      frameCount = 0
      canvas = new OffscreenCanvas(1, 1)
      context = canvas.getContext('2d', { alpha: false })
      self.postMessage({ type: 'ready' })
      return
    }

    if (data.type === 'frame' && poseLandmarker && handLandmarker) {
      const { bitmap, timestamp } = data
      if (!bitmap) return
      try {
        if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) {
          canvas.width = bitmap.width
          canvas.height = bitmap.height
        }
        context.drawImage(bitmap, 0, 0)
      } finally {
        // ImageBitmap fue transferido al worker; cerrarlo en cualquier ruta libera su memoria gráfica.
        bitmap.close()
      }

      // La inferencia ocurre íntegramente en este hilo; Phaser solo recibe landmarks compactos.
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
